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
export function ns(namespaceURI, tag, options) {
	if (typeof tag !== "string") {
		throw new TypeError("Property tag must be a string")
	}
	const el = document.createElementNS(
		namespaceURI || "http://www.w3.org/1999/xhtml",
		tag,
		typeof options === "object" && typeof options.is === "string" ? options.is : null
	)
	if (typeof options === "object" && typeof options.oncreate === "function") {
		options.oncreate(el)
	}
	return el
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
