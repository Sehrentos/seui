/**
 * @typedef {{[key:string]:(prev:string,now:string)=>any}} TRoute a route object
 */

export default class Router {
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
	 * router.router(document.body, "/", {
	 *   "/": Home, // also the default route
	 *   "/info": () => Info(),
	 *   "#!/error/(.+)": (prev, now) => { // uses RegExp search
	 *     console.log(`3. Navigated from ${prev} to ${now}`)
	 *     document.body.replaceChildren(tags.div("Error! You have navigated to the error page."))
	 *     return false // stop further processing
	 *   },
	 * })
	 */
	router(root, defaultRoute, routes) {
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
	 * @returns {void}
	 */
	update() {
		try {
			const prevUrl = String(this.lastURL)
			const nextUrl = this.lastURL = document.URL
			const root = this.root
			const defaultRoute = this.defaultRoute
			const routes = this.routes
			let routeCallback
			let routeCallbackResult
			let useRegExp
			// when route url matches String or RegExp, invoke it's callback
			for (const key in routes) {
				// check if the key is normal or RegExp String
				useRegExp = key.indexOf("#!/") === 0
				if (
					(!useRegExp && location.hash === "#!" + key)
					|| (useRegExp && new RegExp(key).test(document.URL))
				) {
					routeCallback = routes[key]
					routeCallbackResult = routeCallback.apply(window.location, [prevUrl, nextUrl])
					// @ts-ignore custom ondestroy method on the previous route
					// if (typeof this._prevRouteCallbackResult === "object" && typeof this._prevRouteCallbackResult.ondestroy === "function") {
					// 	// @ts-ignore custom ondestroy on the container element
					// 	this._prevRouteCallbackResult.ondestroy()
					// }
					// this._prevRouteCallbackResult = routeCallbackResult
					// if callback returns a Node, replace the body with it (render)
					if (routeCallbackResult instanceof Node) {
						root.replaceChildren(routeCallbackResult)
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
				// fallback to the default route
				if (window.location.hash !== defaultRoute) {
					window.location.hash = defaultRoute.indexOf("#!/") === 0 ? defaultRoute : "#!" + defaultRoute
				}
			}
		} catch (e) {
			console.error("router error", e)
			window.location.hash = `#!/error/${encodeURIComponent(e.message)}`
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
