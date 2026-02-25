import Observable from "./Observable.js"

/**
 * @typedef {{[key:string]:(prev:string,now:string,...params:string[])=>any}} TRoute a route object
 */

export class Router {
	/**
	 * The constructor for the Router class.
	 *
	 * @example
	 * import { Router } from "./seui.js"
	 * const router = new Router()
	 */
	constructor() {
		/** @type {HTMLElement|undefined|null} */
		this.root
		/** @type {string} */
		this.defaultRoute = ""
		/** @type {TRoute} */
		this.routes = {}
		/**
		 * The observable state of the router.
		 * @type {Observable<{ newURL: string, oldURL: string, data: any }>}
		 * @example
		 * const unsubscribe = router.state.subscribe(({ newURL, oldURL, data }) => {
		 *   console.log(`Route change from: ${oldURL} to: ${newURL} with data:`, data)
		 *   unsubscribe()
		 * })
		 * // update state
		 * router.state.update({ newURL: '', oldURL: '', data: null })
		 * // navigate to a new route with data
		 * router.go("#!/info", { foo: "bar" })
		 */
		this.state = new Observable({ newURL: "", oldURL: "", data: null })
	}

	/**
	 * Set up the router.
	 *
	 * This function sets up the router by setting root, default route and routes.
	 * It also sets up an event listener for hash changes and updates the current URL.
	 * It can handle both string and RegExp URLs for routing,
	 * but the RegExp search will *only* be used when route starts with `#!/`.
	 * It uses error route (`"#!/error/(.+)"`) when routing fails.
	 * It uses the default as fallback if no other routes match.
	 *
	 * @param {HTMLElement} root root element
	 * @param {string} defaultRoute default route
	 * @param {TRoute} routes route url can callback Object
	 *
	 * @example
	 * import { Router } from "./seui.js"
	 * const router = new Router()
	 * router.init(document.body, "/", {
	 *   "/": Home, // also the default route
	 *   "/info": () => Info(),
	 *   "#!/error/(.+)": (oldURL, newURL, message) => { // uses RegExp search
	 *     console.log(`3. Navigated from ${oldURL} to ${now} with ${message}`)
	 *     return tags.div("Error! You have navigated to the error page with: ${message}"))
	 *   },
	 * })
	 */
	init(root, defaultRoute, routes) {
		this.root = root
		this.defaultRoute = defaultRoute
		this.routes = routes
		this.state.value.oldURL = "" // document.URL set initial URL eg. "http://localhost/"
		this.state.value.newURL = ""
		this.state.value.data = null
		// make sure window event is binded only once
		if (typeof this._onHashChange !== "function") {
			this._onHashChange = this.onHashChange.bind(this)
			window.addEventListener('hashchange', this._onHashChange, false)
		}
		// initial update
		this.update(document.URL, this.state.value.oldURL)
	}

	/**
	 * Handles the hashchange event, triggered when the URL hash changes.
	 * This method is intended to manage navigation state changes due to user
	 * interactions or programmatic hash updates.
	 *
	 * @param {HashChangeEvent} e - The event object containing details about
	 * the hashchange, including the `e.oldURL` and `e.newURL` properties.
	 */
	onHashChange(e) {
		this.update(
			e.newURL, // || document.URL,
			e.oldURL, // || this.state.value.oldURL || document.URL
		)
	}

	/**
	 * Update the router state based on the current URL.
	 * Call the appropriate route callback and updates the UI accordingly.
	 * Call the lifecycle methods `onunmount` before the route update.
	 * Call the lifecycle methods `onmount` after the route update.
	 *
	 * @param {string} [newURL] - optional. The new URL hash.
	 * @param {string} [oldURL] - optional. The old URL hash.
	 * @returns {Promise<void>} A promise that resolves when the route update is complete.
	 */
	async update(newURL, oldURL) {
		const root = this.root;
		const defaultRoute = this.defaultRoute;
		const routes = this.routes;

		try {
			let routeCallback;
			let routeCallbackPromise;
			let routeMatched = false;
			let matchedRouteKey = ''; // Store the key that matched for potential use with regex groups

			// Try to match string routes first (exact hash match)
			for (const key in routes) {
				if (key.indexOf("#!/") !== 0 && location.hash === "#!" + key) {
					routeCallback = routes[key];
					routeCallbackPromise = Promise.resolve(routeCallback(
						oldURL || this.state.value.oldURL || document.URL,
						newURL || document.URL
					));
					matchedRouteKey = key;
					routeMatched = true;
					break;
				}
			}

			// If no string route matched, try RegExp routes
			if (!routeMatched) {
				for (const key in routes) {
					if (key.indexOf("#!/") === 0) { // Only consider keys starting with #!/ for RegExp
						const regExp = new RegExp(key);
						const match = document.URL.match(regExp);
						if (!match) {
							continue
						}
						routeCallback = routes[key];
						// If the callback needs regex groups, pass them.
						routeCallbackPromise = Promise.resolve(routeCallback(
							oldURL || this.state.value.oldURL || document.URL,
							newURL || document.URL,
							...match.slice(1)
						));
						matchedRouteKey = key;
						routeMatched = true;
						break;
					}
				}
			}

			// Handle the matched route or fallback to default/error
			if (routeMatched && routeCallback) {
				// #region lifecycle before render
				if (this._activeComponent) {
					// dispatch lifecycle event
					const unmountEvent = new CustomEvent('unmount', {
						bubbles: false,
						cancelable: true,
						detail: {
							component: this._activeComponent
						}
					});
					// Note: this event will execute on DocumentFragment
					if (this._activeComponent instanceof DocumentFragment) {
						this._activeComponent.dispatchEvent(unmountEvent);
					}
					// dispatch lifecycle event on every child element
					// Note: this event will NOT execute on DocumentFragment
					if (root) invokeEvent(root, unmountEvent);
					// remove events associated with the component
					if (root) removeListeners(root);
				}
				// #endregion lifecycle before render

				// wait for the route callback
				const routeCallbackResult = await routeCallbackPromise;

				// Handle rendering of the new route
				// when routeCallbackResult is a Node
				if (routeCallbackResult instanceof Node) {
					// render
					if (root) root.replaceChildren(routeCallbackResult);

					// #region lifecycle after render
					// store the current component instance for later use
					this._activeComponent = routeCallbackResult;

					// dispatch lifecycle event onmount
					const mountEvent = new CustomEvent('mount', {
						bubbles: false,
						cancelable: true,
						detail: {
							component: this._activeComponent
						}
					})
					// Note: this will execute on DocumentFragment
					if (routeCallbackResult instanceof DocumentFragment) {
						routeCallbackResult.dispatchEvent(mountEvent);
					}
					// dispatch lifecycle event onmount on every child element
					// Note: this event will NOT execute on DocumentFragment
					if (root) invokeEvent(root, mountEvent);
					// #endregion lifecycle after render
				}

				// signal route update
				this.state.update((current) => ({
					...current,
					newURL: newURL || document.URL,
					oldURL: oldURL || current.oldURL || document.URL
				}));

				return;
			}

			// If no route matched, navigate to default route
			if (window.location.hash !== defaultRoute) {
				window.location.hash = defaultRoute.indexOf("#!/") === 0 ? defaultRoute : "#!" + defaultRoute;
			}

		} catch (/** @type {any} */ e) {
			console.error("Router error:", e);
			window.location.hash = `#!/error/${encodeURIComponent(e.message)}`;
		}
	}

	/**
	 * Updates the URL hash to the specified value.
	 * This triggers a navigation event to the new hash location.
	 * This is a convenience wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/Location/hash|window.location.hash}.
	 *
	 * @param {string} hash - The hash value to navigate to, including the "#!/" character.
	 * @param {any} [data] - Optional set data in the router state.
	 * The data will be available in the `data` parameter of the `route.state` subscriber.
	 * @returns {void}
	 * @example router.go("#!/home")
	 * @example router.go("#!/home", { foo: "bar" })
	 */
	go(hash, data) {
		window.location.hash = hash
		if (!data) {
			return
		}
		// update data in current state
		this.state.update((current) => ({
			...current,
			data
		}))
	}

	/**
	 * Goes back in the browser history.
	 * This is a convenience wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/History/back|window.history.back()}.
	 * @returns {void}
	 * @example router.back()
	 */
	back() {
		window.history.back()
	}

	/**
	 * Set the router data state.
	 * @param {any} data - The data to set in the router state.
	 * @returns {void}
	 */
	setData(data) {
		this.state.update((current) => ({
			...current,
			data
		}))
	}

	/**
	 * Reset the router and remove the event listener
	 * @returns {void}
	 */
	remove() {
		this.root = undefined
		this.defaultRoute = ""
		this.routes = {}
		this.state.unsubscribeAll()
		this.state.update({ newURL: "", oldURL: "", data: null })
		if (typeof this._onHashChange === "function") {
			window.removeEventListener('hashchange', this._onHashChange, false)
			this._onHashChange = undefined
		}
	}
}

export default Router

/**
 * Helper method to listen for a single `'hashchange'` event
 * and then remove the event listener.
 *
 * @param {(e: HashChangeEvent)=>void} callback The function to be called when the navigation event occurs.
 * You can check the `e.oldURL` and `e.newURL` properties to get the previous and current URLs.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event|hashchange event}
 * @example onceNavigate((e) => { console.log(`${e.type} from: ${e.oldURL} to: ${e.newURL}`) })
 * @returns {()=>void} A backup function to remove the event listener manually
 */
export const onceNavigate = (callback) => {
	const listener = (e) => {
		window.removeEventListener('hashchange', listener, false)
		callback(e)
	}
	window.addEventListener('hashchange', listener, false)
	return () => window.removeEventListener('hashchange', listener, false)
}


/**
 * Dispatches a custom event on the given target element and all its child elements.
 *
 * This function traverses through the DOM tree starting from the given element,
 * and dispatches the given event on every traversed element.
 *
 * @param {HTMLElement|Element} target - The DOM element on which to dispatch the event.
 * @param {CustomEvent} event - The event to dispatch.
 */
function invokeEvent(target, event) {
	if (target == null) {
		return
	}
	target.dispatchEvent(event)
	if (target.children.length > 0) {
		for (const child of target.children) {
			invokeEvent(child, event)
		}
	}
}

/**
 * Removes an event listener from an element and removes it from the element's
 * internal `_listeners` array.
 * @param {Element} element
 * @param {string} type
 * @param {(this: Element, ev: Event) => any} handler
 * @param {boolean | AddEventListenerOptions} [options] Optional. Options to pass eg. `{ capture: true }`
 */
function removeListener(element, type, handler, options) {
	if (element['_listeners'] == null) {
		return
	}
	for (let i = 0; i < element['_listeners'].length; i++) {
		const listener = element['_listeners'][i]
		if (listener.key === type && listener.handler === handler && listener.options === options) {
			element['_listeners'].splice(i, 1)
			// if (LIFECYCLES.includes(key)) {
			// 	// @ts-ignore string is valid key
			// 	element.removeEventListener(key, handler, { capture: true })
			// 	return
			// }
			// @ts-ignore string is valid key
			element.removeEventListener(type, handler, options)
			return
		}
	}
}

/**
 * Recursively removes all event listeners from an element and its child elements.
 *
 * This function traverses through the DOM tree starting from the given element,
 * and removes all event listeners stored in the element's `_listeners` property.
 * It first processes all child elements, ensuring that every descendant element
 * is also cleared of its event listeners.
 *
 * @param {HTMLElement|Element} element - The DOM element from which to remove event listeners.
 */
function removeListeners(element) {
	if (element == null) {
		return
	}
	if (element.children.length > 0) {
		for (const child of element.children) {
			removeListeners(child)
		}
	}
	if (element['_listeners'] != null) {
		for (const listener of element['_listeners']) {
			// if (LIFECYCLES.includes(listener.key)) {
			// 	element.removeEventListener(listener.key, listener.handler, { capture: true })
			// } else {
			element.removeEventListener(listener.key, listener.handler, listener.options)
			// }
			// console.log("Removed listener:", listener)
		}
		element['_listeners'] = null
	}
}

/**
 * The single instance of the application router ready to use.
 * Use this object to set up routes and navigate.
 *
 * @example
 * // In your main app module:
 * import { router } from './seui.js';
 * import Home from './pages/Home.js';
 * import Info from './pages/Info.js';
 *
 * router.init(document.body, "/", {
 *   "/": Home,
 *   "/info": () => Info(),
 * });
 *
 * // To navigate:
 * router.go("#!/info");
 */
export const router = new Router()
