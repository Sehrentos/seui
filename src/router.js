/**
 * @typedef {{[key:string]:(prev:string,now:string,...params:string[])=>any}} TRoute a route object
 * @typedef {import("./observable").Observable<{ newURL: string, oldURL: string, data: any }>} TObservableState
 */

/**
 * Converts a route path with parameters (e.g., "/user/:id") into a regular expression for matching URLs.
 * @param {string} path
 */
const pathToRegex = (path) => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "([^/]+)") + "$");

/**
 * Dispatches a custom event on the given target element and all its child elements.
 *
 * This function traverses through the DOM tree starting from the given element,
 * and dispatches the given event on every traversed element.
 *
 * @param {HTMLElement|Element} target - The DOM element on which to dispatch the event.
 * @param {CustomEvent} event - The event to dispatch.
 */
const invokeEvent = (target, event) => {
	if (target == null) return
	if (target.children.length > 0) {
		for (const child of target.children) {
			invokeEvent(child, event)
		}
	}
	target.dispatchEvent(event)
}

/**
 * Removes an event listener from an element and removes it from the element's
 * custom `_listeners` array.
 * @param {Element} element
 * @param {string} type
 * @param {(this: Element, ev: Event) => any} handler
 * @param {boolean | AddEventListenerOptions} [options] Optional. Options to pass eg. `{ capture: true }`
 */
const removeListener = (element, type, handler, options) => {
	if (element['_listeners'] == null) return
	for (let i = 0; i < element['_listeners'].length; i++) {
		const listener = element['_listeners'][i]
		if (listener.key === type && listener.handler === handler && listener.options === options) {
			element['_listeners'].splice(i, 1)
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
const removeListeners = (element) => {
	if (element == null) return
	if (element.children.length > 0) {
		for (const child of element.children) {
			removeListeners(child)
		}
	}
	if (element['_listeners'] != null) {
		for (const listener of element['_listeners']) {
			element.removeEventListener(listener.key, listener.handler, listener.options)
		}
		element['_listeners'] = undefined
	}
}

/**
 * The HashRouter class represents a client-side router that uses the URL hash to manage navigation.
 */
export class HashRouter {
	/**
	 * The constructor for the "hashbang" Router class.
	 *
	 * Why hashbang? Because it uses the URL hash (the part after the `#` symbol) to manage client-side routing.
	 * It required zero configuration and works in all browsers without needing server-side support (404) for routing.
	 * It listens for changes to the URL hash and updates the UI accordingly based on the defined routes.
	 *
	 * This function sets up the router by setting root, default route and routes.
	 * It also sets up an event listener for hash changes and updates the current URL.
	 *
	 * It uses error route (`"/error/:msg"`) when routing fails.
	 * It uses the default as fallback if no other routes match.
	 *
	 * @param {HTMLElement|null} [root] root element
	 * @param {string} [defaultRoute] default route
	 * @param {TRoute} [routes] routes
	 * @param {TObservableState} [state] optional. pass observer for router to update
	 *
	 * @example
	 * import { HashRouter } from "seui/router"
	 * const router = new HashRouter(document.body, "/", {
	 *   "/": Home,
	 *   "/info": () => Info(),
	 *   "/error/:message": (oldURL, newURL, message) => {
	 *     console.log(`Navigated from ${oldURL} to ${newURL} with ${message}`)
	 *     return tags.div("Error! You have navigated to the error page with: ${message}"))
	 *   },
	 * })
	 */
	constructor(root, defaultRoute, routes, state) {
		/** @type {HTMLElement|undefined|null} */
		this.root = root
		/** @type {string} */
		this.defaultRoute = defaultRoute || "/"
		/** @type {TRoute} */
		this.routes = routes || {}
		/** @type {string} */
		this.oldURL = window.location.hash || "/"
		/** @type {TObservableState|undefined} */
		this.state = state
		this._onHashChange = this.onHashChange.bind(this)
		this._onLoad = () => this.update()
		window.addEventListener('hashchange', this._onHashChange, false)
		window.addEventListener('load', this._onLoad, false)
	}

	/**
	 * Set up the router.
	 *
	 * @param {HTMLElement} root root element
	 * @param {string} defaultRoute default route
	 * @param {TRoute} routes route url can callback Object
	 * @param {TObservableState} [state] optional. pass observer for router to update
	 *
	 * @example
	 * import { HashRouter } from "./seui/router"
	 * const router = new HashRouter()
	 * router.setup(document.body, "/", {
	 *   "/": Home, // also the default route
	 *   "/info": () => Info(),
	 *   "/error/:message": (oldURL, newURL, state, message) => { // uses RegExp search
	 *     console.log(`Navigated from ${oldURL} to ${newURL} with ${message}`)
	 *     return tags.div("Error! You have navigated to the error page with: ${message}"))
	 *   },
	 * })
	 */
	setup(root, defaultRoute, routes, state) {
		this.root = root
		this.defaultRoute = defaultRoute || "/"
		this.routes = routes || {}
		this.state = state
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
		this.update()
	}

	/**
	 * Update the router state based on the current URL.
	 * Call the appropriate route callback and updates the UI accordingly.
	 * Call the lifecycle methods `onunmount` before the route update.
	 * Call the lifecycle methods `onmount` after the route update.
	 *
	 * @param {*} [state] - optional. The new state object.
	 * @returns {Promise<void>} A promise that resolves when the route update is complete.
	 */
	async update(state) {
		const routes = this.routes;
		const newURL = (window.location.hash || "#!/").replace("#!/", "/");
		const oldURL = (this.oldURL || "#!/").replace("#!/", "/");
		this.oldURL = newURL;
		try {
			let routeCallbackPromise;

			for (const key in routes) {
				const regExp = pathToRegex(key);
				const match = newURL.match(regExp);

				if (match == null) continue;

				// promisify the route callback in case it's not already a promise
				// call the route callback with regex groups as parameters
				routeCallbackPromise = Promise.resolve(routes[key](
					oldURL,
					newURL,
					...match.slice(1) // pass regex groups as parameters
				));

				break;
			}

			// If no route matched, use the default route?
			if (routeCallbackPromise == null) {
				console.warn('Router no route matched', { newURL, oldURL });
				// window.location.hash = `#!${this.defaultRoute}`;
				return;
			}

			// wait for the route callback to complete and get the result
			const routeCallbackResult = await routeCallbackPromise;

			// lifecycle before render
			this.beforeRender(routeCallbackResult);

			// render the new view based on the route callback result
			this.render(routeCallbackResult);

			// lifecycle after render
			this.afterRender(routeCallbackResult);

			// set the router state and signal update to subscribers
			this.state?.update((current) => ({
				...current,
				newURL,
				oldURL,
				data: state ?? current.data
			}));

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
	 * @example router.go("#!/home")
	 * @example router.go("#!/home", { foo: "bar" })
	 */
	go(hash, data) {
		// update data in current state
		this.state?.update((current) => ({
			...current,
			data
		}))
		window.location.hash = hash
	}

	/**
	 * Goes back in the browser history.
	 * This is a convenience wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/History/back|window.history.back()}.
	 * @example router.back()
	 */
	back() {
		window.history.back()
	}

	/**
	 * Reset the router and remove event listeners
	 */
	remove() {
		this.root = undefined
		this.defaultRoute = "/"
		this.routes = {}
		this.oldURL = "/"
		this.state?.unsubscribeAll()
		this.state = undefined
		if (typeof this._onHashChange === "function") {
			window.removeEventListener('hashchange', this._onHashChange, false)
		}
		if (typeof this._onLoad === "function") {
			window.removeEventListener('load', this._onLoad, false)
		}
	}

	/**
	 * Before render lifecycle method to clean up the previous route's component and events.
	 * @param {*} view - The next component/node to render after this method is called.
	 */
	beforeRender(view) {
		if (this._activeComponent == null) return;
		// dispatch custom lifecycle event
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
		if (this.root) {
			invokeEvent(this.root, unmountEvent);
			// remove all events associated with the component
			removeListeners(this.root);
		}
	}

	/**
	 * Lifecycle method after render. Dispatches a "mount" event on the active component
	 * and its children, and stores the current component instance for later use.
	 * @param {*} view - The rendered component/node.
	 */
	afterRender(view) {
		if (this.root == null || view == null) return;
		// store the current component instance for later use
		this._activeComponent = view;
		// dispatch lifecycle event onmount
		const mountEvent = new CustomEvent('mount', {
			bubbles: false,
			cancelable: true,
			detail: {
				component: this._activeComponent
			}
		})
		// Note: this will execute on DocumentFragment
		if (view instanceof DocumentFragment) {
			view.dispatchEvent(mountEvent);
		}
		// dispatch lifecycle event onmount on every child element
		// Note: this event will NOT execute on DocumentFragment
		invokeEvent(this.root, mountEvent);
	}

	/**
	 * Handle rendering of the new route based on the result from the route callback.
	 * If the result is a Node, it will be rendered into the root element.
	 * If the result is not a Node, it will be logged as a warning.
	 * This method can be extended to handle different types of route callback results, such as strings or objects, and render them accordingly.
	 * @param {*} view - The rendered component/node.
	 */
	render(view) {
		if (this.root == null) return;
		if (view instanceof Node) {
			this.root.replaceChildren(view);
		} else {
			// If the route callback does not return a Node, we can choose to handle it differently.
			// For example, if it returns a string, we could render it as HTML or text.
			// Or if it returns an object, we could pass it to the component as props/state.
			// For now, we will just log it.
			console.warn("Route callback result is not a Node:", view)
			this.root.replaceChildren(String(view));
		}
	}

	/**
	 * Helper method to listen for a single `'hashchange'` event
	 * and then remove the event listener.
	 *
	 * @param {(e: HashChangeEvent)=>void} callback The function to be called when the navigation event occurs.
	 * You can check the `e.oldURL` and `e.newURL` properties to get the previous and current URLs.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event|hashchange event}.
	 * @example HashRouter.onceNavigate((e) => { console.log(`${e.type} from: ${e.oldURL} to: ${e.newURL}`) })
	 * @returns {()=>void} A backup function to remove the event listener manually
	 */
	static onceNavigate = (callback) => {
		const listener = (e) => {
			window.removeEventListener('hashchange', listener, false)
			callback(e)
		}
		window.addEventListener('hashchange', listener, false)
		return () => window.removeEventListener('hashchange', listener, false)
	}
}

/**
 * The HistoryRouter class represents a client-side router that uses the History API to manage navigation.
 */
export class HistoryRouter {
	/**
	 * The constructor for the HistoryRouter class.
	 * It initializes the router with optional root element, default route, and route definitions.
	 * The router uses the History API to manage client-side routing without relying on URL hashes.
	 * It uses error path `"/error/:msg"` to show error messages.
	 *
	 * @param {HTMLElement} [root] root element
	 * @param {string} [defaultRoute] default route
	 * @param {TRoute} [routes] route url can callback Object
	 * @param {TObservableState} [state] optional. pass observer for router to update
	 *
	 * @example
	 * import { HistoryRouter } from "seui/router"
	 * const router = new HistoryRouter(document.body, "/", {
	 *   "/": Home,
	 *   "/info": Info,
	 *   "/user/:id": (prev, now, id) => {
	 *   	console.log(`Navigated from ${prev} to ${now} with ${id}`)
	 *   	return div("Hello! You have navigated to the user page with ID: " + id)
	 *   },
	 *   "/album/:id/detail/:type": (prev, now, id, type) => {
	 *   	console.log(`Navigated from ${prev} to ${now} with ${id}`)
	 *   	return div("Hello! You have navigated to the album detail page with ID: " + id + " and type: " + type)
	 *   },
	 *  "/error": ErrorPage
	 * })
	 */
	constructor(root, defaultRoute, routes, state) {
		/** @type {HTMLElement|undefined|null} */
		this.root = root
		/** @type {string} */
		this.defaultRoute = defaultRoute || "/"
		/** @type {TRoute} */
		this.routes = routes || {}
		/** @type {TObservableState|undefined} */
		this.state = state
		/** @type {string} */
		this.oldURL = window.location.pathname
		this._onPopState = this.onPopState.bind(this)
		this._onLoad = () => this.update()
		window.addEventListener('popstate', this._onPopState, false)
		window.addEventListener('load', this._onLoad, false)
	}

	/**
	 * Set up the router with new parameters.
	 * @param {HTMLElement} root root element
	 * @param {string} defaultRoute default route
	 * @param {TRoute} routes route url can callback Object
	 * @param {TObservableState} [state] optional. pass observer for router to update
	 */
	setup(root, defaultRoute, routes, state) {
		this.root = root
		this.defaultRoute = defaultRoute || "/"
		this.routes = routes || {}
		this.state = state
	}

	/**
	 * Handles the popstate event, triggered when the active history entry changes.
	 * This method is intended to manage navigation state changes due to user
	 * interactions with the browser's back and forward buttons, or programmatic
	 * calls to history.pushState() or history.replaceState().
	 * @param {PopStateEvent} e
	 */
	onPopState(e) {
		this.update(e.state)
	}

	/**
	 * Update the router state based on the current URL.
	 * Call the appropriate route callback and updates the UI accordingly.
	 * Call the lifecycle methods `onunmount` before the route update.
	 * Call the lifecycle methods `onmount` after the route update.
	 * @param {any} [state]
	 */
	async update(state) {
		const routes = this.routes;
		const newURL = window.location.pathname
		const oldURL = this.oldURL;
		this.oldURL = newURL;
		try {
			// route callback can be async, so we promisify it in case it's not already a promise
			let routeCallbackPromise;

			for (const key in routes) {
				const regExp = pathToRegex(key);
				const match = newURL.match(regExp);

				if (match == null) continue;

				// promisify the route callback in case it's not already a promise
				// call the route callback with regex groups as parameters
				routeCallbackPromise = Promise.resolve(routes[key](
					oldURL,
					newURL,
					...match.slice(1) // pass regex groups as parameters
				));

				break;
			}

			// If no route matched, navigate to default route
			if (routeCallbackPromise == null) {
				// console.warn(`No route matched for ${newURL}, navigating to default route: ${this.defaultRoute}`)
				window.history.pushState(state, "", this.defaultRoute);
				this.update(state);
				return;
			}

			// wait for the route callback to complete and get the result
			const routeCallbackResult = await routeCallbackPromise;

			// lifecycle before render
			this.beforeRender(routeCallbackResult);

			// render the new view based on the route callback result
			this.render(routeCallbackResult);

			// lifecycle after render
			this.afterRender(routeCallbackResult);

			// update URL without reloading the page
			// prevent unnecessary pushState if URL is already correct
			if (newURL !== window.location.pathname) {
				window.history.pushState(state, "", newURL)
			}

			// update observer state
			this.state?.update((current) => ({
				...current,
				newURL,
				oldURL,
				data: state ?? current.data
			}))

		} catch (/** @type {any} */ e) {
			// This catch block is to handle any errors that occur during the route update process,
			// including errors thrown by the route callbacks or lifecycle methods.
			console.warn(`Router error navigating to error route: ${e.message || e}`);
			window.history.pushState({ type: "error", message: e.message || e }, "", `/error/${encodeURIComponent(e.message || e)}`);
			this.update({ type: "error", message: e.message || e });
		}
	}

	/**
	 * Updates the URL path to the specified value.
	 * This triggers a navigation event to the new path location.
	 * This is a convenience wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/History/pushState|window.history.pushState()}.
	 *
	 * @param {string} path
	 * @param {*} state optional state to pass with the navigation, will be available in the `state` parameter of the `onPopState` event listener
	 * @example router.go("/info")
	 * @example router.go("/info", { foo: "bar" })
	 */
	go(path, state) {
		window.history.pushState(state, "", path)
		this.update(state)
	}

	/**
	 * Goes back in the browser history.
	 * This is a convenience wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/History/back|window.history.back()}.
	 */
	back() {
		window.history.back()
	}

	/**
	 * Reset the router and remove event listeners
	 */
	remove() {
		this.root = undefined
		this.defaultRoute = "/"
		this.routes = {}
		this.oldURL = "/"
		this.state?.unsubscribeAll()
		this.state = undefined
		if (typeof this._onPopState === "function") {
			window.removeEventListener('popstate', this._onPopState, false)
		}
		if (typeof this._onLoad === "function") {
			window.removeEventListener('load', this._onLoad, false)
		}
	}

	/**
	 * Before render lifecycle method to clean up the previous route's component and events.
	 * @param {*} view - The next component/node to render after this method is called.
	 */
	beforeRender(view) {
		if (this._activeComponent == null) return;
		// dispatch custom lifecycle event
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
		if (this.root) {
			invokeEvent(this.root, unmountEvent);
			// remove all events associated with the component
			removeListeners(this.root);
		}
	}

	/**
	 * Lifecycle method after render. Dispatches a "mount" event on the active component
	 * and its children, and stores the current component instance for later use.
	 * @param {*} view - The rendered component/node.
	 */
	afterRender(view) {
		if (this.root == null || view == null) return;
		// store the current component instance for later use
		this._activeComponent = view;
		// dispatch lifecycle event onmount
		const mountEvent = new CustomEvent('mount', {
			bubbles: false,
			cancelable: true,
			detail: {
				component: this._activeComponent
			}
		})
		// Note: this will execute on DocumentFragment
		if (view instanceof DocumentFragment) {
			view.dispatchEvent(mountEvent);
		}
		// dispatch lifecycle event onmount on every child element
		// Note: this event will NOT execute on DocumentFragment
		invokeEvent(this.root, mountEvent);
	}

	/**
	 * Handle rendering of the new route based on the result from the route callback.
	 * If the result is a Node, it will be rendered into the root element.
	 * If the result is not a Node, it will be logged as a warning.
	 * This method can be extended to handle different types of route callback results, such as strings or objects, and render them accordingly.
	 * @param {*} view - The rendered component/node.
	 */
	render(view) {
		if (this.root == null) return;
		if (view instanceof Node) {
			this.root.replaceChildren(view);
		} else {
			// If the route callback does not return a Node, we can choose to handle it differently.
			// For example, if it returns a string, we could render it as HTML or text.
			// Or if it returns an object, we could pass it to the component as props/state.
			// For now, we will just log it.
			console.warn("Route callback result is not a Node:", view)
			this.root.replaceChildren(String(view));
		}
	}
}
