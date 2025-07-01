/**
 * @typedef {{[key:string]:(...args:any[])=>HTMLElement}} TagsProxy a proxy object for HTML tags
 */

/**
 * create a proxy object for HTML tags creation
 * @example
 * const { div, h1, p } = tags
 * div(h1("world"), p("world"), {
 *   style: { color: 'red' }, // add properties
 *   oncreate: (e) => { // use custom function
 *     console.log("element", e, "is created.")
 *   }
 * });
 *
 * @type {TagsProxy} a proxy object for HTML tags
 */
export const tags = new Proxy({}, {
	get(target, prop, receiver) {
		return (...children) => {
			if (typeof prop !== "string") {
				throw new TypeError("Property name must be a string")
			}
			return createElement(prop, children)
		}
	}
})

/**
 * Create an HTML element with the specified tag and append children to it.
 * @param {string} tag - The type of element to be created.
 * @param {Array<any>} children - The children to append to the created element.
 * @returns {HTMLElement|DocumentFragment} The created element with appended children.
 * @throws {TypeError} If the tag is not a string.
 */
export function createElement(tag, children) {
	// const container = document.createDocumentFragment()
	const el = tag === "fragment" ? document.createDocumentFragment() : document.createElement(tag)
	// Process children or properties of an element.
	// Invoke custom `oncreate` function if provided, that is invoked before element is added into DOM.
	for (const child of children) {
		if (child == null) {
			continue;
		}
		if (typeof child === "string") {
			// add string as text node
			el.appendChild(document.createTextNode(child))
		} else if (child instanceof String) {
			// add String as text node
			el.appendChild(document.createTextNode(child.toString()))
		} else if (child instanceof Element || child instanceof DocumentFragment || (typeof child === "object" && typeof child.appendChild === "function")) {
			// add as element
			el.appendChild(child)
		} else if (child.constructor === Object) {
			// merge plain objects
			merge(el, child)
			// invoke the custom oncreate if it exists
			if (typeof child.oncreate === "function") {
				child.oncreate(el)
			}
		}
	}
	// return container.appendChild(el)
	return el
}

/**
 * create HTML tag with namespace URI and qualified name
 * @param {string} namespaceURI A string that specifies the `namespaceURI` to associate with the element.
 * @returns {TagsProxy} A function that creates an HTML element with the specified tag and namespace URI.
 * @example ns("http://www.w3.org/1999/xhtml", "div")
 * @example ns("http://www.w3.org/2000/svg", "svg", { oncreate: (svg) => {
 *   svg.setAttribute('style', 'border: 1px solid black')
 *   svg.setAttribute("width", "100px")
 *   svg.setAttribute("height", "100px")
 *   svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
 * }})
 */
export function ns(namespaceURI) {
	return new Proxy({}, {
		get(target, prop, receiver) {
			return (...children) => {
				if (typeof prop !== "string") {
					throw new TypeError("Property name must be a string")
				}
				const element = document.createElementNS(
					namespaceURI, // e.g. "http://www.w3.org/1999/xhtml",
					prop, // e.g. "div",
					typeof children[0] === "object" && typeof children[0].is === "string" ? children[0].is : null
				)
				// Now, handle rest children
				for (const child of children) {
					if (child == null) {
						continue;
					}
					if (typeof child === "string") {
						// add string as text node
						element.appendChild(document.createTextNode(child))
					} else if (child instanceof String) {
						// add String as text node
						element.appendChild(document.createTextNode(child.toString()))
					} else if (child instanceof Element || child instanceof DocumentFragment || (typeof child === "object" && typeof child.appendChild === "function")) {
						// add as element
						element.appendChild(child)
					} else if (child.constructor === Object) {
						// plain object
						for (let key in child) {
							// skip custom lifecycle method and NS is attribute
							if (key === "oncreate" || key === "is") {
								continue
							}
							element.setAttribute(key, String(child[key]));
						}
						// invoke the custom oncreate if it exists
						if (typeof child.oncreate === "function") {
							child.oncreate(element)
						}
					}
				}
				return element
			}
		}
	})
}

/**
 * util function to merge objects
 * @returns {Object} merged object
 * @example merge({ a: 1 }, { b: 2 })
 */
function merge(target, props) {
	for (const prop in props) {
		if (props.hasOwnProperty(prop)) {
			if (props[prop].constructor === Object) {
				merge(target[prop], props[prop]) // next-level
			} else {
				target[prop] = props[prop]
			}
		}
	}
	return target
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
		/** @type {string} */
		this.lastURL = ""
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
	 *   "#!/error/(.+)": (prev, now) => { // uses RegExp search
	 *     console.log(`3. Navigated from ${prev} to ${now}`)
	 *     document.body.replaceChildren(tags.div("Error! You have navigated to the error page."))
	 *     return false // stop further processing
	 *   },
	 * })
	 */
	init(root, defaultRoute, routes) {
		this.root = root
		this.defaultRoute = defaultRoute
		this.routes = { ...routes, ...routes }
		this.lastURL = document.URL // set initial URL eg. "http://localhost/"
		// make sure window event is binded only once
		if (typeof this._onHashChange !== "function") {
			this._onHashChange = this.update.bind(this)
			window.addEventListener('hashchange', this._onHashChange, false)
		}
		// initial update
		this.update()
	}

	/**
	 * Update the router state based on the current URL.
	 * Calls the appropriate route callback and updates the UI accordingly.
	 * Calls custom `ondestroy` method on the previous route.
	 * @returns {Promise<void>} A promise that resolves when the route update is complete.
	 */
	async update() {
		const prevUrl = String(this.lastURL);
		const nextUrl = (this.lastURL = document.URL);
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
					routeCallbackPromise = () => Promise.resolve(
						routeCallback(prevUrl, nextUrl)
					);
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
						if (match) {
							routeCallback = routes[key];
							// If the callback needs regex groups, pass them.
							routeCallbackPromise = () => Promise.resolve(
								routeCallback(prevUrl, nextUrl, ...match.slice(1))
							);
							matchedRouteKey = key;
							routeMatched = true;
							break;
						}
					}
				}
			}

			// Handle the matched route or fallback to default/error
			if (routeMatched && routeCallback) {
				// Handle previous route's cleanup if component was rendered
				// This assumes `routeCallbackResult` holds the component's root element
				// and that component has a `cleanup` method.
				// You would need to store the previous component instance and its cleanup method.
				// Let's add a place to store the active component's cleanup
				if (this._activeComponentCleanup && typeof this._activeComponentCleanup === 'function') {
					this._activeComponentCleanup();
					this._activeComponentCleanup = null; // Clear reference
				}

				const routeCallbackResult = await routeCallbackPromise();

				if (routeCallbackResult instanceof Node) {
					root.replaceChildren(routeCallbackResult);
					// If the component returned an element AND has a cleanup method attached to it:
					// @ts-ignore custom lifecycle method
					if (typeof routeCallbackResult.cleanup === 'function') {
						// @ts-ignore
						this._activeComponentCleanup = routeCallbackResult.cleanup;
					}
					return;
				}
				// optional. other types of routeCallbackResult
				// if (routeCallbackResult === false) {
				// 	return;
				// }
			} else {
				// No route matched
				if (window.location.hash !== defaultRoute) {
					window.location.hash = defaultRoute.indexOf("#!/") === 0 ? defaultRoute : "#!" + defaultRoute;
				}
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
	 * @returns {void}
	 * @example router.go("#!/home")
	 */
	go(hash) {
		window.location.hash = hash
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
	 * Reset the router and remove the event listener
	 * @returns {void}
	 */
	remove() {
		this.root = undefined
		this.defaultRoute = ""
		this.routes = {}
		this.lastURL = ""
		if (typeof this._onHashChange === "function") {
			window.removeEventListener('hashchange', this._onHashChange, false)
			this._onHashChange = undefined
		}
	}
}

/**
 * The single instance of the application router.
 * Use this object to set up routes and navigate.
 * @type {Router}
 * @example
 * // In your main app module:
 * import { router } from './seui.js'; // or wherever you export it
 * import Home from './pages/Home.js';
 * import Info from './pages/Info.js';
 *
 * router.init(document.body, "/", {
 * "/": Home,
 * "/info": () => Info(),
 * });
 *
 * // To navigate:
 * router.go("#!/info");
 */
export const router = new Router()

/**
 * Helper method to listen for a single navigation event
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
 * @typedef {(newValue: T, oldValue: T) => void} ObserverCallback
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
	 * @returns {ObserverCallback<T>} The observer function that was added.
	 */
	subscribe(observer) {
		this.observers.push(observer);
		return observer;
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
		this.observers.forEach((observer) => observer(this._value, oldValue));
	}

	/**
	 * The current value of the Observable.
	 * @type {T}
	 */
	get value() {
		return this._value;
	}

	/**
	 * Sets the value of the Observable.
	 * Any registered observers are called with the new and old value after the update.
	 * @param {T} value The new value to set.
	 * @returns {void}
	 */
	set value(value) {
		this._value = value;
		this.update();
	}
}
// #endregion Observable
