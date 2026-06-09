//#region signal
let activeEffect
let batching = false
const dirtyEffects = new Set()

/**
 * @template T
 * @typedef {Object} Signal
 * @property {T} value - The current value of the signal. Can be read and written.
 * @property {0} __signal__ - A marker property to identify signal objects.
 */

/**
 * Creates a reactive signal object.
 * A signal is a reactive object that can be read and written.
 * When a signal is written to, all effects subscribed to it will be re-run.
 * Signals are used to manage simple, isolated reactive values.
 * @template T
 * @param {T} value The initial value of the signal.
 * @returns {Signal<T>} A reactive signal object.
 */
export const signal = (value) => {
	const subscribers = new Set()
	return {
		__signal__: 0, // to detect signal objects
		get value() {
			// console.log('\x1b[32m[signal] read (1):\x1b[0m', value, subscribers.size, activeEffect)
			if (activeEffect) {
				subscribers.add(activeEffect)
				activeEffect.deps.add(subscribers) // For cleanup later
			}
			return value
		},
		set value(newValue) {
			// console.log('\x1b[32m[signal] write:\x1b[0m', value, newValue, subscribers.size, activeEffect)
			if (value === newValue) return
			value = newValue
			const copyOfSubscribers = Array.from(subscribers)
			for (const sub of copyOfSubscribers) {
				if (batching) {
					dirtyEffects.add(sub) // Just mark it "dirty" for now
				} else {
					sub.run() // Immediate update
				}
			}
		}
	}
}

/**
 * Creates an effect object.
 * An effect is a reactive object that can be read and written.
 * When an effect is written to, all effects subscribed to it will be re-run.
 * Effects are used to manage complex, nested reactive data structures.
 * @param {()=>void} fn The function to be executed when the effect is re-run.
 * @returns {()=>void} A function that, when called, will manually dispose of the effect object.
 */
export const effect = (fn) => {
	const effectObj = {
		deps: new Set(),
		run() {
			cleanup(effectObj) // Clear old deps before re-running
			const prevEffect = activeEffect
			activeEffect = effectObj
			try { fn() } finally {
				activeEffect = prevEffect
			}
		}
	}
	// console.log('\x1b[33m[signal] effect:\x1b[0m', effectObj)
	effectObj.run()
	return () => cleanup(effectObj) // Return a manual disposer
}

/**
 * Creates a computed reactive value.
 * A computed is a reactive object that can be read and written.
 * When a computed is written to, all effects subscribed to it will be re-run.
 * Computed values are lazily evaluated, meaning they are only re-calculated when their value is requested.
 * Computed values can be thought of as cached effects.
 * They are used to manage complex, nested reactive data structures.
 * @template T
 * @param {()=>T} fn The function to be executed when the computed's value is requested.
 * @returns {Signal<T>} A reactive object with a getter function.
 */
export const computed = (fn) => {
	let cachedValue
	let isDirty = true // Does the value need re-calculating?

	// A Computed is essentially an Effect that also acts as a Signal
	const effectObj = {
		deps: new Set(),
		run() {
			if (!isDirty) {
				isDirty = true
				// Tell everyone listening to THIS computed that we are now dirty
				const copyOfSubscribers = Array.from(subscribers)
				for (const sub of copyOfSubscribers) sub.run()
			}
		}
	}

	const subscribers = new Set()

	return {
		__signal__: 0,
		get value() {
			// 1. Dependency Tracking (as a Signal)
			if (activeEffect) {
				subscribers.add(activeEffect)
				activeEffect.deps.add(subscribers)
			}

			// 2. Lazy Evaluation (The "Brain")
			if (isDirty) {
				const prevEffect = activeEffect
				activeEffect = effectObj
				try {
					cachedValue = fn() // Calculate & discover inner dependencies
				} finally {
					activeEffect = prevEffect
				}
				isDirty = false
			}
			return cachedValue
		}
	}
}

/**
 * Cleans up the dependencies of an effect object.
 * This function is used internally by the effect API to clean up
 * after an effect has been run.
 * @param {Object} effectObj - The effect object to clean up.
 */
function cleanup(effectObj) {
	for (const subSet of effectObj.deps) {
		subSet.delete(effectObj)
	}
	effectObj.deps.clear()
}

/**
 * The effect batching
 *
 * @param {()=>void} fn - The function to be batched
 * @example
 * const name = signal("John")
 * const age = signal(30)
 * const stop = effect(() => {
 *   console.log(`Update: ${name.value} is ${age.value}`)
 * })
 * batch(() => {
 *   name.value = "Jane"
 *   age.value = 31
 * })
 * stop()
 */
export function batch(fn) {
	batching = true
	fn()
	batching = false
	for (const e of dirtyEffects) e.run()
	dirtyEffects.clear()
}
//#endregion signal

//#region UI
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

/** find object with "is" attribute.  e.g. { is: "custom-element" } */
const getCreateOptions = (c) => c.find(p => p != null && typeof p === "object" && p.constructor === Object && typeof p.is === "string")

/**
 * Create an HTML element with the specified tag and append children to it.
 * @param {string|null} namespace - The namespace URI of the element to be created.
 * @param {string} tag - The type of element to be created.
 * @param {Array<any>} children - The children to append to the created element or properties.
 * @returns {Element|HTMLElement|DocumentFragment|Text} The created element with appended children.
 * @throws {TypeError} If the tag is not a string.
 */
const createElement = (namespace, tag, children) => {
	let element
	// create element
	if (namespace) {
		element = document.createElementNS(
			namespace, // e.g. "http://www.w3.org/1999/xhtml",
			tag, // e.g. "div",
			getCreateOptions(children)
		)
	} else if (tag === "fragment") {
		element = document.createDocumentFragment()
	} else if (tag === "text") {
		element = document.createTextNode("")
	} else {
		element = document.createElement(
			tag,
			getCreateOptions(children)
		)
	}

	// Process children or properties of an element.
	for (const child of children) {
		if (child != null) applyChildProperties(element, child, !!namespace)
	}

	// dispatch oncreate lifecycle event
	element.dispatchEvent(new Event('create', {
		bubbles: false,
		cancelable: true,
	}))

	return element
}

/**
 * Helper for processing children or properties of an element.
 * @param {*} element
 * @param {*} child
 * @param {boolean} [useAttrOnly=false]
 */
const applyChildProperties = (element, child, useAttrOnly = false) => {
	// Check if the child is a Signal type
	// This is where you handle reactive text. Instead of just setting nodeValue once,
	// you wrap it in an effect so it updates whenever the signal changes.
	if (child && typeof child === "object" && /*child?.__signal__ !== undefined*/"__signal__" in child) {
		const textNode = document.createTextNode("")
		element.appendChild(textNode)
		// Link the signal to the text node
		// and save the disposer
		const stop = effect(() => textNode.nodeValue = String(child?.value ?? ""))
		// Attach the disposer to the element's cleanup bucket
		addCleanup(element, stop)
	} else if (typeof child === "string") {
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
			element.nodeValue = typeof child === "string" ? child : child.toString()
		} else {
			// add as text node
			element.appendChild(document.createTextNode(typeof child === "string" ? child : child.toString()))
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
const merge = (target, props, forceAttribute = false) => {
	for (const prop in props) {
		if (!props.hasOwnProperty(prop)) continue
		const value = props[prop]
		// handle signals (reactive) eg. computed
		if (value && typeof value === "object" && /*value?.__signal__ !== undefined*/"__signal__" in value) {
			const stop = effect(() => applySingleProp(target, prop, value.value, forceAttribute))
			// Attach the disposer to the element's cleanup bucket
			addCleanup(target, stop)
		}
		// handle nested objects (like 'style')
		else if (value && value.constructor === Object) {
			if (!target[prop]) target[prop] = {}
			merge(target[prop], value, forceAttribute)
		}
		else {
			applySingleProp(target, prop, value, forceAttribute)
		}
	}
	return target
}

/**
 * Applies a single property to the target element.
 * Handles events (e.g. "onclick"), forced attributes (e.g. SVG width/height),
 * direct property mapping (e.g. element.className), and falls back to attribute assignment.
 * @param {Object} target The target element to apply the property to.
 * @param {string} prop The name of the property to apply.
 * @param {*} value The value to apply to the property.
 * @param {boolean} [forceAttribute=false] Optional. Force assignment of the property as an attribute,
 * even if it has a direct property mapping (e.g. SVG width/height).
 */
const applySingleProp = (target, prop, value, forceAttribute) => {
	// events
	if (prop.startsWith("on")) {
		const type = prop.slice(2).toLowerCase()
		// If it's an array [handler, options], spread it
		const [handler, options] = Array.isArray(value) ? value : [value]
		target.addEventListener(type, handler, options)
		// Attach the disposer to the element's cleanup bucket
		addCleanup(target, () => { // stop/unsubscribe
			target.removeEventListener(type, handler, options)
		})
	}
	// forced attributes (SVG, etc) or special cases
	else if (forceAttribute || prop.startsWith('data-') || prop === 'style') {
		target.setAttribute(prop, value)
	}
	// direct property mapping
	else if (prop in target) {
		target[prop] = value
	}
	// fallback
	else {
		target.setAttribute(prop, value)
	}
}

//#region MEMORY / CLEANUP

/**
 * Adds a cleanup function to an element. When the element is removed from the DOM, all cleanup functions will be called.
 * @param {Object} el The element to add the cleanup function to.
 * @param {() => void} disposer The cleanup function to add.
 */
const addCleanup = (el, disposer) => {
	if (!el._cleanups) el._cleanups = []
	el._cleanups.push(disposer)
}

/**
 * Runs all cleanup functions stored on an element and its children.
 * When an element is removed from the DOM, all its cleanup functions will be called.
 * @param {Object} el The element to clean up.
 */
const runCleanup = (el) => {
	if (el._cleanups && el._cleanups.length) {
		el._cleanups.forEach(stop => stop())
		el._cleanups = []
	}
	// Recursively clean up children!
	Array.from(el.children || []).forEach(runCleanup)
}

// Automatic cleanup detection
// Notes: Node is the base class for all types of nodes, including Element,
// but also Text, Comment, DocumentFragment, etc
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		mutation.addedNodes.forEach(node => {
			if (node instanceof Element || node instanceof Text) {
				node.dispatchEvent(new Event('mount', {
					bubbles: false,
					cancelable: true
				}))
			}
		})
		mutation.removedNodes.forEach(node => {
			if (node instanceof Element || node instanceof Text || node instanceof DocumentFragment) {
				node.dispatchEvent(new Event('unmount', {
					bubbles: false,
					cancelable: true
				}))
				runCleanup(node)
			}
		})
	}
})

// Start watching the whole document
observer.observe(document.body, { childList: true, subtree: true })

//#endregion MEMORY / CLEANUP

/**
 * create a proxy object for HTML tags creation
 * @example
 * const { div, h1, p } = tags
 * div(h1("world"), p("world"), { style: { color: 'red' } })
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
export const ns = (namespaceURI) => new Proxy({}, {
	get(target, prop, receiver) {
		return (...children) => {
			if (typeof prop !== "string") {
				throw new TypeError("Property name must be a string")
			}
			return createElement(namespaceURI, prop, children)
		}
	}
})

/**
 * Helper function to add style elements to the document head.
 *
 * @param {...string|{href?:string,rel?:string,type?:string}&{[key:string]:string}} style See [style](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/style) or [link](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link) for reference.
 *
 * @example
 * addStyle(`
 * 	body {
 * 		font-size: 1em;
 * 	}
 * `)
 * @example
 * addStyle(
 * 	{ rel: "icon" href: "favicon.ico" },
 * 	{ rel: "manifest" href: "manifest.json" },
 * 	{
 * 		href: "./some-styles.css",
 * 		rel: "stylesheet",
 * 		type: "text/css"
 * 	}
 * )
 */
export const addStyle = (...style) => {
	const fragment = document.createDocumentFragment()
	for (const s of style) {
		if (typeof s === "string") {
			const styleElement = document.createElement("style")
			styleElement.textContent = s
			fragment.appendChild(styleElement)
		} else {
			const linkElement = document.createElement("link")
			for (const key in s) {
				linkElement.setAttribute(key, s[key])
			}
			fragment.appendChild(linkElement)
		}
	}
	document.head.appendChild(fragment)
}
//#endregion UI
