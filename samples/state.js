import Observable from "seui/observable";

// Global state objects for the app

/**
 * Note: remember to unsubscribe global observers
 */
export const globalState = new Observable({
	navigations: 0,
	clicks: 0,
})

/**
 * @type {import("../src/router").TObservableState}
 */
export const routerState = new Observable({ newURL: "", oldURL: "", data: undefined })

export default { globalState, routerState }
