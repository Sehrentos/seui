import { tags, State, onceNavigate } from "../../seui.js"
import Navigation from "../components/Navigation.js"

const { a, p, h1, span, button, fragment } = tags

export default function StateTest() {
	// 1. create a reactive state object
	const counter = State({ count: 0, user: { name: "Alice", age: 30 } }, true)
	const counterSpan = span(JSON.stringify(counter))
	// const counterObserver = counter.subscribe()

	// 2. Subscribe to ANY change in myState
	const unsubscribeAllChanges = counter.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[ANY CHANGE] Key: '${String(key)}' changed from '${oldValue}' to '${newValue}' in:`, obj);
		counterSpan.textContent = JSON.stringify(counter)
	});

	// 3. Subscribe to a specific property change (e.g., 'count')
	const unsubscribeCount = counter.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[COUNT CHANGE] Count updated from ${oldValue} to ${newValue}. Current: ${obj.count}`);
		counterSpan.textContent = JSON.stringify(counter)
	}, 'count');

	// 4. Subscribe to a nested property change (this requires the deep proxying)
	// Note: The `key` in the callback will be 'user' when myState.user is assigned a new object.
	// But if you do myState.user.name = 'Bob', the `key` will be 'name' and `obj` will be the proxied `user` object.
	const unsubscribeUserName = counter.user.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[USER NAME CHANGE] User name changed from '${oldValue}' to '${newValue}'. New user object:`, obj);
		counterSpan.textContent = JSON.stringify(counter)
	}, 'name'); // Call subscribe on the nested proxy

	// 5. Subscribe to ANY change in user state
	const unsubscribeUserAllChanges = counter.user.subscribe((obj, key, oldValue, newValue) => {
		console.log(`[ANY CHANGE] Key: '${String(key)}' changed from '${oldValue}' to '${newValue}' in:`, obj);
		counterSpan.textContent = JSON.stringify(counter)
	});

	// cleanup routine on route change
	// this will trigger when the user navigates to another page
	onceNavigate((e) => {
		// globalState.unsubscribe(globalObserver)
		// counter.unsubscribe(counterObserver)
		unsubscribeAllChanges()
		unsubscribeCount()
		unsubscribeUserName()
		unsubscribeUserAllChanges()
		console.log(`StateTest::cleanup from: ${e.oldURL} to: ${e.newURL}`, counter)
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
				counter.count = counter.count + 1
				counter.user.name = counter.user.name === "Alice" ? "BoB" : "Alice"
				counter.user.age = counter.user.age + 1
			}
		}),
	)
}
