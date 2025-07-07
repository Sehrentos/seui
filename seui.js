/**
 * @typedef {{[key:string]:(...props: UIProps)=>HTMLElement}} TagsProxy a proxy object for HTML tags
 * @typedef {Array<string|number|boolean|bigint|Node|Element|HTMLElement|LifecycleMethods|UIAttributes>} UIProps
 * @typedef {{[key:string]:any}} UIAttributes
 * @typedef {(e:CustomEvent & { target: HTMLElement&{ _listeners: {key:string,handler:()=>any}[] } })=>any} LifecycleCallback
 * @typedef {Object} LifecycleMethods
 * @prop {LifecycleCallback} oncreate a callback to be invoked when the element is created
 * @prop {LifecycleCallback} onmount a callback to be invoked when the element is mounted
 * @prop {LifecycleCallback} onunmount a callback to be invoked when the element is unmounted
 */

const LIFECYCLES = ["oncreate", "onmount", "onunmount"]

/**
 * create a proxy object for HTML tags creation
 * @example
 * const { div, h1, p } = tags
 * div(h1("world"), p("world"), { style: { color: 'red' } });
 *
 * @type {TagsProxy} a proxy object for HTML tags
 */
export const tags = new Proxy({}, {
	get(target, prop, receiver) {
		return (...children) => {
			if (typeof prop !== "string") {
				throw new TypeError("Property name must be a string")
			}
			return createElement(null, prop, children)
		}
	}
})

/**
 * Create an HTML element with the specified tag and append children to it.
 * @param {string|null} namespace - The namespace URI of the element to be created.
 * @param {string} tag - The type of element to be created.
 * @param {Array<any>} children - The children to append to the created element or properties.
 * @returns {Element|HTMLElement|DocumentFragment|Text} The created element with appended children.
 * @throws {TypeError} If the tag is not a string.
 */
export function createElement(namespace, tag, children) {
	let element
	// find object with "is" attribute
	let elementCreateOptions = children.find(p => typeof p === "object" && p.constructor === Object && typeof p.is === "string")

	// create element
	if (namespace) {
		element = document.createElementNS(
			namespace, // e.g. "http://www.w3.org/1999/xhtml",
			tag, // e.g. "div",
			elementCreateOptions
		)
	} else if (tag === "fragment") {
		element = document.createDocumentFragment()
	} else if (tag === "text") {
		element = document.createTextNode("")
	} else {
		element = document.createElement(tag, elementCreateOptions)
	}

	// Process children or properties of an element.
	// Invoke custom `oncreate` function if provided, that is invoked before element is added into DOM.
	for (const child of children) {
		if (child == null) {
			continue;
		}
		if (typeof child === "string") {
			// when element itself is Text node
			if (element instanceof Text) {
				element.nodeValue = child
			} else {
				// add string as text node
				element.appendChild(document.createTextNode(child))
			}
		} else if (child instanceof String || typeof child === "number"
			|| typeof child === "boolean" || typeof child === "bigint") {
			// when element itself is Text node
			if (element instanceof Text) {
				element.nodeValue = String(child)
			} else {
				// add as text node
				element.appendChild(document.createTextNode(String(child)))
			}
		} else if (child instanceof Element || child instanceof DocumentFragment
			|| (typeof child === "object" && typeof child.appendChild === "function")) {
			// add as element
			element.appendChild(child)
		} else if (child.constructor === Object) {
			// merge plain objects
			merge(element, child, !!namespace)
		}
	}

	// dispatch oncreate lifecycle event
	element.dispatchEvent(new CustomEvent('create', {
		bubbles: false,
		cancelable: true,
		detail: {
			component: element
		}
	}))

	return element
}

/**
 * create HTML tag with namespace URI and qualified name
 * @param {string} namespaceURI A string that specifies the `namespaceURI` to associate with the element.
 * @returns {TagsProxy} A function that creates an HTML element with the specified tag and namespace URI.
 * @example
 * const { div } = ns("http://www.w3.org/1999/xhtml")
 * @example
 * const { svg, path } = ns("http://www.w3.org/2000/svg")
 * const MyComponent = () => svg({ width: 100, height: 100 }, path({ d: "M0 0 L100 0 L100 100 L0 100 Z" }))
 */
export function ns(namespaceURI) {
	return new Proxy({}, {
		get(target, prop, receiver) {
			return (...children) => {
				if (typeof prop !== "string") {
					throw new TypeError("Property name must be a string")
				}
				return createElement(namespaceURI, prop, children)
			}
		}
	})
}

/**
 * util function to merge objects and apply attributes to elements
 * @param {Object} target
 * @param {Object} props
 * @param {boolean} [forceAttribute=false] optional. force attribute assignment e.g. SVG element width/height
 * @returns {Object} merged object
 */
function merge(target, props, forceAttribute = false) {
	for (const prop in props) {
		if (props.hasOwnProperty(prop)) {
			if (props[prop].constructor === Object) {
				// next-level object
				merge(target[prop], props[prop])
				continue
			}
			// element
			if (target instanceof Element
				|| target instanceof DocumentFragment
				|| (typeof target === "object" && typeof target.appendChild === "function")) {
				// custom lifecycle handling for events
				if (prop.indexOf("on") === 0) {
					// add event listener
					addEventListener(target, prop.slice(2), props[prop])
					continue
				}
			}
			// attribute
			if (forceAttribute && typeof target.setAttribute === "function") {
				// force attribute assignment e.g. SVG element width/height
				target.setAttribute(prop, props[prop])
				// TODO setAttributeNS support with array of 3 parameters?
				// svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
			} else if (prop in target && prop !== 'style' && !prop.startsWith('data-')) {
				// Common properties: direct assignment
				target[prop] = props[prop]
			} else if (typeof target.setAttribute === "function") {
				// fallback for other attributes or style attribute
				target.setAttribute(prop, props[prop])
			} else {
				// fallback to common properties
				target[prop] = props[prop]
			}
		}
	}
	return target
}

/**
 * Adds an event listener to an element and stores it in the element's
 * internal `_listeners` array.
 * @param {Element} element
 * @param {string} key
 * @param {function} handler
 */
function addEventListener(element, key, handler) {
	if (element['_listeners'] === undefined) {
		element['_listeners'] = []
	}
	element['_listeners'].push({ key, handler })
	// if (LIFECYCLES.includes(key)) {
	// 	// @ts-ignore string is valid key
	// 	element.addEventListener(key, handler, { capture: true })
	// 	return
	// }
	// @ts-ignore string is valid key
	element.addEventListener(key, handler)
}

/**
 * Removes an event listener from an element and removes it from the element's
 * internal `_listeners` array.
 * @param {Element} element
 * @param {string} key
 * @param {function} handler
 */
function removeEventListener(element, key, handler) {
	if (element['_listeners'] == null) {
		return
	}
	for (let i = 0; i < element['_listeners'].length; i++) {
		const listener = element['_listeners'][i]
		if (listener.key === key && listener.handler === handler) {
			element['_listeners'].splice(i, 1)
			// if (LIFECYCLES.includes(key)) {
			// 	// @ts-ignore string is valid key
			// 	element.removeEventListener(key, handler, { capture: true })
			// 	return
			// }
			// @ts-ignore string is valid key
			element.removeEventListener(key, handler)
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
function removeEventListeners(element) {
	if (element == null) {
		return
	}
	if (element.children.length > 0) {
		for (const child of element.children) {
			removeEventListeners(child)
		}
	}
	if (element['_listeners'] != null) {
		for (const listener of element['_listeners']) {
			// if (LIFECYCLES.includes(listener.key)) {
			// 	element.removeEventListener(listener.key, listener.handler, { capture: true })
			// } else {
			element.removeEventListener(listener.key, listener.handler)
			// }
			// console.log("Removed listener:", listener)
		}
		element['_listeners'] = null
	}
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

// #region Router
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
		/** @type {HTMLElement} */
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
						oldURL,
						newURL
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
							oldURL,
							newURL,
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
					invokeEvent(root, unmountEvent);
					// remove events associated with the component
					removeEventListeners(root);
				}
				// #endregion lifecycle before render

				// wait for the route callback
				const routeCallbackResult = await routeCallbackPromise;

				// Handle rendering of the new route
				// when routeCallbackResult is a Node
				if (routeCallbackResult instanceof Node) {
					// render
					root.replaceChildren(routeCallbackResult);

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
					invokeEvent(root, mountEvent);
					// #endregion lifecycle after render
				}

				// signal route update
				this.state.update((current) => ({
					...current,
					newURL,
					oldURL
				}));

				return;
			}

			// If no route matched, navigate to default route
			if (window.location.hash !== defaultRoute) {
				window.location.hash = defaultRoute.indexOf("#!/") === 0 ? defaultRoute : "#!" + defaultRoute;
			}

		} catch (e) {
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

// #endregion Router

// #region State
/**
 * @callback UnsubscribeFunction
 * @returns {void}
 */

/**
 * Callback function invoked when a observed property changes.
 * @template T The type of the object being observed (or its nested part).
 * @param {T} target The proxied object where the change occurred (could be the root or a nested proxied object/array).
 * @param {string | symbol} key The key (property name or array index) that changed.
 * @param {any} oldValue The previous value of the property.
 * @param {any} newValue The new value of the property.
 * @returns {void}
 */

/**
 * @callback ObservableCallback
 * @param {any} target The proxied object where the change occurred (could be the root or a nested proxied object/array).
 * @param {string | symbol} key The key (property name or array index) that changed.
 * @param {any} oldValue The previous value of the property.
 * @param {any} newValue The new value of the property.
 * @returns {void}
 */

/**
 * Method to subscribe to changes on the observed object.
 * @callback SubscribeMethod
 * @param {ObservableCallback} callback The function to call when a change is detected.
 * @param {string | symbol} [specificKey] Optional. If provided, the callback will only fire for changes to this specific property.
 * @returns {UnsubscribeFunction} A function to unsubscribe this specific callback.
 */

/**
 * Method to unsubscribe a callback from changes on the observed object.
 * @callback UnsubscribeMethod
 * @param {ObservableCallback} callback The callback function to remove.
 * @param {string | symbol} [specificKey] Optional. If provided, removes only the callback for this specific property.
 * @returns {void}
 */

/**
 * State as an observable utility
 *
 * This can observe almost any type, except `new Set()`, `new Map()`
 *
 * @template T The type of the target object being observed.
 * @param {T} target Target to observe.
 * @param {boolean} [isAsync=false] Invoke the callbacks as asynchronous or synchronous.
 * @returns {T extends object ? T & {subscribe: SubscribeMethod, unsubscribe: UnsubscribeMethod} : {value: T} & {subscribe: SubscribeMethod, unsubscribe: UnsubscribeMethod}} The proxied target with added subscribe/unsubscribe methods.
 */
export function State(target, isAsync = false) {
	// Stores callbacks for ANY change to the observed object.
	const subscribers = new Set();
	// Stores callbacks for specific property changes (key -> Set of callbacks).
	const propertySubscribers = new Map();

	/**
	 * Notifies all general subscribers and specific property subscribers.
	 * @param {Object} _target The proxied object.
	 * @param {string | symbol} key The key that changed.
	 * @param {*} oldValue The previous value of the property.
	 * @param {*} newValue The new value of the property.
	 */
	const notifySubscribers = (_target, key, oldValue, newValue) => {
		const executeCallback = (callback) => {
			if (isAsync) {
				if (typeof queueMicrotask === "function") {
					queueMicrotask(() => callback(_target, key, oldValue, newValue));
				} else if (typeof Promise === "function") {
					Promise.resolve().then(() => callback(_target, key, oldValue, newValue));
				} else {
					setTimeout(() => callback(_target, key, oldValue, newValue), 0);
				}
			} else {
				callback(_target, key, oldValue, newValue);
			}
		};

		// Notify general subscribers
		subscribers.forEach(executeCallback);

		// Notify specific property subscribers
		if (propertySubscribers.has(key)) {
			propertySubscribers.get(key).forEach(executeCallback);
		}
	};

	const handler = {
		get(currentTarget, key, receiver) {
			if (key === 'isProxy') return true;

			// --- Subscription methods ---
			if (key === 'subscribe') {
				return (callback, specificKey = null) => {
					if (typeof callback !== 'function') {
						throw Error("Subscribe callback must be a function.");
						// return () => { }; // Return a no-op unsubscribe
					}
					if (specificKey) {
						if (!propertySubscribers.has(specificKey)) {
							propertySubscribers.set(specificKey, new Set());
						}
						propertySubscribers.get(specificKey).add(callback);
						return () => propertySubscribers.get(specificKey).delete(callback);
					}
					subscribers.add(callback);
					return () => subscribers.delete(callback);
				};
			}
			if (key === 'unsubscribe') {
				// Or, just return a function that calls the unsubscribe returned by `subscribe`
				// This method would be less common if subscribe returns an unsubscribe function.
				return (callback, specificKey = null) => {
					if (specificKey) {
						if (propertySubscribers.has(specificKey)) {
							propertySubscribers.get(specificKey).delete(callback);
						}
					} else {
						subscribers.delete(callback);
					}
				};
			}
			// --- End Subscription methods ---

			const prop = currentTarget[key];

			// return if property not found (and not a subscription method)
			if (prop === undefined && key !== 'subscribe' && key !== 'unsubscribe') return;
			if (prop === null) return null;

			// set value as proxy if object and not already proxied
			if (typeof prop === 'object' && prop !== null && !prop.isProxy) {
				currentTarget[key] = State(prop, isAsync); // Recursively apply new observer
			}

			return currentTarget[key];
		},
		set(currentTarget, key, newValue, receiver) {
			const oldValue = currentTarget[key];
			const result = Reflect.set(currentTarget, key, newValue, receiver); // Perform the actual set

			// Only notify if the value actually changed (important for primitives)
			if (result && oldValue !== newValue) {
				notifySubscribers(receiver, key, oldValue, newValue);
			}
			return result; // Reflect.set returns true on success, false on failure
		},
		deleteProperty(currentTarget, key) {
			const oldValue = currentTarget[key];
			const result = Reflect.deleteProperty(currentTarget, key);
			if (result) {
				notifySubscribers(currentTarget, key, oldValue, undefined); // Value is now undefined
			}
			return result;
		}
	};

	switch (typeof target) {
		case "undefined":
		case "string":
		case "number":
		case "boolean":
		case "bigint":
		case "symbol": // primitive types
			return new Proxy({ value: target }, handler);

		case "object":
			if (target === null ||
				target instanceof String ||
				target instanceof Boolean ||
				target instanceof Number) {
				// primitive types
				return new Proxy({ value: target }, handler);
			}
			if (target instanceof Set) throw Error(`State cannot observe "Set" type`);
			if (target instanceof Map) throw Error(`State cannot observe "Map" type`); // Also add Map here
			return new Proxy(target, handler);

		default:
			throw Error(`State cannot observe "${typeof target}" type`);
	}
}
// #endregion State

// #region Observable
/**
 * Callback function invoked when an observable's value changes.
 * @typedef {(newValue: T, oldValue: T, observer: ObserverCallback<T>) => void} ObserverCallback
 * @template T The type of the Observable's value for this specific callback instance.
 */

/**
 * An observable value that can be updated and observed.
 * @template T The type of the value held by the Observable.
 */
export class Observable {
	/**
	 * Create an Observable instance with the given initial value.
	 * @param {T} value Initial value of the observable.
	 */
	constructor(value) {
		/** @type {T} */
		this._value = value;
		/** @type {Array<ObserverCallback<T>>} */
		this.observers = [];
	}

	/**
	 * Add an observer to the list of observers.
	 * @param {ObserverCallback<T>} observer The function to be called when the observable's value changes.
	 * @returns {UnsubscribeFunction} A function to unsubscribe the observer from the list of observers.
	 * @example
	 * const observable = new Observable(0);
	 * const observer = (newValue, oldValue) => console.log("Observable value changed from", oldValue, "to", newValue);
	 * // subscribes the observer and returns an unsubscribe function
	 * const unsubscribe = observable.subscribe(observer);
	 * unsubscribe(); // unsubscribes the observer
	 * @example
	 * const observable = new Observable(0);
	 * const unsubscribe = observable.subscribe(function observerCallback(newValue, oldValue, observer) {
	 * 	console.log("Observable value changed from", oldValue, "to", newValue);
	 *  // unsubscribe from the observable:
	 *  unsubscribe();
	 *  observable.unsubscribe(observer); // or this
	 *  observable.unsubscribe(observerCallback); // or this
	 * })
	 */
	subscribe(observer) {
		this.observers.push(observer);
		return () => this.unsubscribe(observer);
	}

	/**
	 * Remove an observer from the list of observers.
	 * @param {ObserverCallback<T>} observer The function to be removed.
	 * @returns {void}
	 */
	unsubscribe(observer) {
		this.observers = this.observers.filter((obs) => obs !== observer);
	}

	/**
	 * Remove all observers from the list of observers.
	 * @returns {void}
	 */
	unsubscribeAll() {
		this.observers = [];
	}

	/**
	 * Update the value of the Observable.
	 * If the argument is a function, it's called with the current value as argument.
	 * If the argument is not a function, the value is simply updated to the given value.
	 * Any registered observers are called with the new and old value after the update.
	 * @param {((value: T) => T) | T} [updater] The value or a function to update the value with.
	 */
	update(updater) {
		let oldValue = this._value;
		if (typeof updater === 'function') {
			// @ts-ignore function type is checked
			this._value = updater(this._value);
		} else {
			this._value = updater;
		}
		this.observers.forEach((observer) => observer(this._value, oldValue, observer));
	}

	/**
	 * The current value of the Observable.
	 * @type {T}
	 */
	get value() {
		return this._value;
	}

	/**
	 * Sets the value of the Observable without notifying observers.
	 * @param {T} value The new value to set.
	 * @returns {void}
	 */
	set value(value) {
		this._value = value;
	}
}
// #endregion Observable

/**
 * The single instance of the application router.
 * Use this object to set up routes and navigate.
 * @type {Router}
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
