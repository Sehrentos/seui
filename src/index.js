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

// const LIFECYCLES = ["oncreate", "onmount", "onunmount"]

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
 * Create an HTML element with the specified tag and append children to it.
 * @param {string|null} namespace - The namespace URI of the element to be created.
 * @param {string} tag - The type of element to be created.
 * @param {Array<any>} children - The children to append to the created element or properties.
 * @returns {Element|HTMLElement|DocumentFragment|Text} The created element with appended children.
 * @throws {TypeError} If the tag is not a string.
 */
function createElement(namespace, tag, children) {
	let element
	// find object with "is" attribute
	let elementCreateOptions = children.find(p => p != null && typeof p === "object" && p.constructor === Object && typeof p.is === "string")

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
	for (const child of children) {
		if (child != null) applyChildProperties(element, child, !!namespace)
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
 * Helper for processing children or properties of an element.
 * @param {*} element
 * @param {*} child
 * @param {boolean} [useAttrOnly=false]
 */
function applyChildProperties(element, child, useAttrOnly = false) {
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
		merge(element, child, useAttrOnly)
	}
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
					// add event listener with capture/options
					// eg. ontouchstart: [(e) => { ... }, { passive: true }]
					if (Array.isArray(props[prop])) {
						addListener(target, prop.slice(2), props[prop][0], props[prop][1])
						continue
					}
					// normal
					addListener(target, prop.slice(2), props[prop])
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
 * @param {string} type
 * @param {(this: Element, ev: Event) => any} handler
 * @param {boolean | AddEventListenerOptions} [options] Optional. Options to pass eg. `{ capture: true }`
 */
function addListener(element, type, handler, options) {
	if (element['_listeners'] === undefined) {
		element['_listeners'] = []
	}
	element['_listeners'].push({ key: type, handler, options })
	// if (LIFECYCLES.includes(key)) {
	// 	// @ts-ignore string is valid key
	// 	element.addEventListener(key, handler, { capture: true })
	// 	return
	// }
	// @ts-ignore string is valid key
	element.addEventListener(type, handler, options)
}
