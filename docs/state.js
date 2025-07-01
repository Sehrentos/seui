import { Observable } from "../seui.js";

/**
 * Note: remember to unsubscribe global observers
 */
const globalState = new Observable({
	navigations: 0,
	clicks: 0,
})

export { globalState }
