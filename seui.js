/*!
 * seui.js v1.0.0
 * @author Niko H. <https://github.com/Sehrentos/seui>
 * @license MIT
 */

/**
 * @typedef {{[key:string]:(...args:any[])=>HTMLElement}} TagsProxy a proxy object for HTML tags
 *
 * @typedef {{[key:string]:(prev:string,now:string)=>any}} TRoute a route object
 */

// #region router variables
/** @type {HTMLElement} */
let _root
/** @type {string} */
let _defaultRoute
/** @type {TRoute} */
let _routes = {}
let _lastURL = ""
let _isWindowBinded = false
// #endregion router variables

// #region seui
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
const tags = new Proxy({}, {
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
function createElement(tag, children) {
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
		} else if (typeof child.appendChild === "function" || child instanceof Element) {
			// add as element
			el.appendChild(child)
		} else if (child.constructor === Object) {
			// merge plain objects
			merge(el, child)
		}
		// invoke the custom oncreate if it exists
		if (typeof child.oncreate === "function") {
			child.oncreate(el)
		}
	}
	// return container.appendChild(el)
	return el
}

/**
 * helper function to merge objects
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

/**
 * create document fragment and append children to it
 * @returns {DocumentFragment}
 * @example document.body.append(fragment(
 *   tags.div("Hello"),
 *   tags.p("World")
 * ))
 */
function fragment(...children) {
	const fragment = document.createDocumentFragment()
	for (const child of children) {
		if (child != null) {
			if (child instanceof Element || typeof child.appendChild === "function") {
				fragment.appendChild(child)
			} else if (typeof child === "string") {
				fragment.appendChild(document.createTextNode(child))
			} else if (child.constructor === Object) {
				// invoke oncreate if it exists
				if (typeof child.oncreate === "function") {
					child.oncreate(fragment)
				}
			}
		}
	}
	return fragment
}

/**
 * create HTML tag with namespace URI and qualified name
 * @param {string} namespaceURI A string that specifies the `namespaceURI` to associate with the element.
 * @param {string} tag A string that specifies the type of element to be created.
 * @param {{is?:string, oncreate?:((element:Element)=>void)}} [options] An optional `ElementCreationOptions` object containing a single property named `is` and custom `oncreate` function
 * @returns {Element}
 * @example ns("http://www.w3.org/1999/xhtml", "div")
 * @example ns("http://www.w3.org/2000/svg", "svg", { oncreate: (svg) => {
 *   svg.setAttribute('style', 'border: 1px solid black')
 *   svg.setAttribute("width", "100px")
 *   svg.setAttribute("height", "100px")
 *   svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
 * }})
 */
function ns(namespaceURI, tag, options) {
	if (typeof tag !== "string") {
		throw new TypeError("Property tag must be a string")
	}
	const el = document.createElementNS(
		namespaceURI || "http://www.w3.org/1999/xhtml",
		tag,
		options && typeof options.is === "string" ? options.is : null
	)
	if (options && typeof options.oncreate === "function") {
		options.oncreate(el)
	}
	return el
}
// #endregion seui

// #region router
/**
 * Create a new `"hashchange"` event router for `seui` module.
 *
 * This function initializes the router with the provided routes.
 * It sets up an event listener for hash changes and updates the current URL.
 * It can handle both string and RegExp URLs for routing,
 * but the RegExp search will *only* be used when route starts with `#!/`.
 * It uses error route (`"#!/error/(.+)"`) when routing fails.
 * It uses the default as fallback if no other routes match.
 *
 * @param {TRoute} routes route url can callback Object
 *
 * @example
 * import { router } from "./router.js"
 * router(document.body, "/", {
 *   "/": Home, // also the default route
 *   "/info": () => Info(),
 *   "#!/error/(.+)": (prev, now) => { // uses RegExp search
 *     console.log(`3. Navigated from ${prev} to ${now}`)
 *     document.body.replaceChildren(tags.div("Error! You have navigated to the error page."))
 *     return false // stop further processing
 *   },
 * })
 */
function router(target, defaultRoute, routes) {
	_lastURL = document.URL // set initial URL eg. "http://localhost/"
	_root = target
	_defaultRoute = defaultRoute
	_routes = { ..._routes, ...routes }
	// make sure window event is binded only once
	if (!_isWindowBinded) {
		window.addEventListener('hashchange', update, false)
		_isWindowBinded = true
	}
	// initial update
	update()
}

/**
 * Update the router state based on the current URL.
 * @returns {void}
 */
function update() {
	try {
		let routeCallback
		let routeCallbackResult
		let useRegExp
		let previous = "" + _lastURL // copy last URL
		_lastURL = document.URL // update last URL for the next update

		// when route url matches String or RegExp, invoke it's callback
		for (const key in _routes) {
			// check if the key is normal or RegExp String
			useRegExp = key.indexOf("#!/") === 0
			if (
				(!useRegExp && location.hash === "#!" + key)
				|| (useRegExp && new RegExp(key).test(document.URL))
			) {
				routeCallback = _routes[key]
				routeCallbackResult = routeCallback.apply(window.location, [previous, document.URL])
				// if callback returns a Node, replace the body with it (render)
				if (routeCallbackResult instanceof Node) {
					document.body.replaceChildren(routeCallbackResult)
					return
				}
				// exit loop if callback returned false
				if (routeCallbackResult === false) {
					return
				}
			}
		}

		// no route matched
		if (routeCallback === undefined) {
			// TODO. use custom "#!/error/(.+)" route instead?
			// if (_routes["#!/error/(.+)"] !== undefined) {
			// 	window.location.hash = "#!/error/404"
			// 	return
			// }

			// fallback to the default route
			if (window.location.hash !== _defaultRoute) {
				window.location.hash = _defaultRoute.indexOf("#!/") === 0 ? _defaultRoute : "#!" + _defaultRoute
			}
		}
	} catch (e) {
		console.error("router error", e)
		window.location.hash = `#!/error/${encodeURIComponent(e.message)}`
	}
}

/**
 * Reset the router and remove the event listener
 * @returns {void}
 */
function remove() {
	_root = undefined
	_defaultRoute = ""
	_routes = {}
	_lastURL = ""
	_isWindowBinded = false
	window.removeEventListener('hashchange', update, false)
}
// #endregion router

export { tags, fragment, ns, createElement, merge, router, update, remove }
