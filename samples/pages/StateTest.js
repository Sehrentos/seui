import { tags } from "seui"
import { HashRouter } from "seui/router"
import State from "seui/state"
import Navigation from "../components/Navigation.js"

const { a, p, h1, span, button, fragment } = tags

export default function StateTest() {
	// 1. create a reactive state object
	const state = State({ count: 0, user: { name: "Alice", age: 30, pets:[] } }, true)
	const counterSpan = span(JSON.stringify(state))
	// const counterObserver = counter.subscribe()

	// 2. Subscribe to ANY change in myState
	const unsubscribeAllChanges = state.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[ANY CHANGE] Key: '${String(key)}' changed from '${oldValue}' to '${newValue}' in:`, obj);
		counterSpan.textContent = JSON.stringify(state)
	});

	// 3. Subscribe to a specific property change (e.g., 'count')
	const unsubscribeCount = state.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[COUNT CHANGE] Count updated from ${oldValue} to ${newValue}. Current: ${obj.count}`);
		counterSpan.textContent = JSON.stringify(state)
	}, 'count');

	// 4. Subscribe to a nested property change (this requires the deep proxying)
	// Note: The `key` in the callback will be 'user' when myState.user is assigned a new object.
	// But if you do myState.user.name = 'Bob', the `key` will be 'name' and `obj` will be the proxied `user` object.
	const unsubscribeUserName = state.user.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[USER NAME CHANGE] User name changed from '${oldValue}' to '${newValue}'. New user object:`, obj);
		counterSpan.textContent = JSON.stringify(state)
	}, 'name'); // Call subscribe on the nested proxy

	// 5. Subscribe to ANY change in user state
	const unsubscribeUserAllChanges = state.user.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[ANY USER CHANGE] Key: '${String(key)}' changed from '${oldValue}' to '${newValue}' in:`, obj);
		counterSpan.textContent = JSON.stringify(state)
	});

	// cleanup routine on route change
	// this will trigger when the user navigates to another page
	HashRouter.onceNavigate((e) => {
		// unsubscribeAllChanges()
		// unsubscribeCount()
		// unsubscribeUserName()
		// unsubscribeUserAllChanges()
		state.unsubscribeAll()
		console.log(`StateTest::cleanup from: ${e.oldURL} to: ${e.newURL}`, state)
	})

	return fragment(
		h1("State test"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/state-test" }, "State test"),
		),
		p("Observable state test..."),
		p("Counter (local): ", counterSpan),
		button("Increment", {
			onclick: () => {
				// these will trigger the subscribers, when the state is updated
				state.count = state.count + 1
				state.user.name = state.user.name === "Alice" ? "BoB" : "Alice"
				state.user.age = state.user.age + 1
				// state.user.pets.push("dog") // this will not trigger subscribers
				state.user.pets = [...state.user.pets, "dog"] // this will trigger subscribers
			}
		}),
	)
}
