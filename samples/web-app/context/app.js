import Observable from 'seui/observable'

/**
 * AppState class that extends Observable to manage the application state,
 * including login status, counter, and timestamp.
 * It also persists the state to localStorage and retrieves it on initialization.
 */
class AppState extends Observable {
	constructor() {
		//#region localStorage persistence
		const savedState = localStorage.getItem('appState')
		super(savedState ? JSON.parse(savedState) : {
			logged: false,
			counter: 0,
			timestamp: Date.now(),
		})

		// subscribe to state changes and save to localStorage
		this.subscribe(() => {
			localStorage.setItem('appState', JSON.stringify(this.value))
		})
		//#endregion

		//#region non-persistent references
		/**
		 * @type {import("seui/router").HistoryRouter?} router - This will
		 * hold the instance of the router, allowing state to interact with routing if needed.
		 */
		this.router = null
		/**
		 * @type {import("seui/router").TObservableState} route - This can
		 * be used to track the current route or any route-related data if desired.
		 * It is not persisted to localStorage.
		 */
		this.route = new Observable({
			newURL: window.location.pathname,
			oldURL: window.location.pathname,
			data: null,
		})
		//#endregion
	}

	//#region state properties with getters and setters for easier access and updates

	/** @type {boolean} */
	get logged() {
		return this.value.logged
	}
	set logged(val) {
		this.update((s) => ({ ...s, logged: val }))
	}

	/** @type {number} */
	get counter() {
		return this.value.counter
	}
	set counter(val) {
		this.update((s) => ({ ...s, counter: val }))
	}

	/** @type {number} */
	get timestamp() {
		return this.value.timestamp
	}
	set timestamp(val) {
		this.update((s) => ({ ...s, timestamp: val }))
	}

	//#endregion

	//#region helper methods

	/**
	 * Navigate to a specified path using the router if available, or fallback to changing window location.
	 * @param {string} path - The path to navigate to.
	 */
	navigateTo(path) {
		if (typeof this.router?.go === "function") {
			return this.router.go(path)
		}
		window.location.href = path // Or .hash = `#!${path}`
	}

	/**
	 * Navigate back to the previous page using the router if available, or fallback to window history.
	 */
	back() {
		if (typeof this.router?.back === "function") {
			return this.router.back()
		}
		window.history.back()
	}

	//#endregion
}

export const appState = new AppState()

export default appState
