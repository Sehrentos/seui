import { tags } from "../seui.js";
import Navigation from "../components/Navigation.js";
import Observable from "./Observable.js";
const { a, h1, p, div, button } = tags;

// Our UI state
const counter = new Observable(0);
const userName = new Observable('Guest');

// #region utils
/**
 * A simple function to make an element reactive to an Observable.
 * You'd extend this to handle different types of updates (textContent, attributes, etc.)
 * @param {HTMLElement} element
 * @param {Observable} observable
 */
function bindText(element, observable) {
	const subscriber = (newValue) => {
		// Here, you'd replace existing text content or update a specific part
		// For simplicity, let's assume replacing the first child if it's a text node, or appending
		if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
			element.firstChild.nodeValue = String(newValue);
		} else {
			element.textContent = String(newValue); // Or more complex diffing
		}
	};
	observable.subscribe(subscriber);

	// Initial render
	subscriber(observable.value);

	// Optionally, return an unsubscribe function if needed for cleanup
	return () => observable.unsubscribe(subscriber);
}
/**
 * And for attributes
 * @param {HTMLElement} element
 * @param {*} attributeName
 * @param {Observable} observable
 * @returns
 */
function bindAttribute(element, attributeName, observable) {
	const subscriber = (newValue) => {
		element.setAttribute(attributeName, String(newValue));
	};
	observable.subscribe(subscriber);
	subscriber(observable.value); // Initial render
	return () => observable.unsubscribe(subscriber);
}
// #endregion

export default function MyReactiveComponentWithObserver() {
	// A span to display the counter
	const counterSpan = tags.span('0'); // Initial text, will be overwritten by bindText
	bindText(counterSpan, counter);

	// A paragraph for the user name
	const userNameP = p();
	bindText(userNameP, userName);

	// A button to increment the counter
	const incrementButton = button(
		"Increment",
		{
			onclick: () => counter.update(c => c + 1)
		}
	);

	// A button to change the user name
	const changeNameButton = button(
		"Change Name",
		{
			onclick: () => userName.update(userName.value === 'Guest' ? 'Alice' : 'Guest')
		}
	);

	return div(
		h1("Reactive Counter & User"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/observer-pattern" }, "Observer Pattern"),
		),
		p("Demo of how to create a reactive component by using the observer pattern."),
		p("Current Count: ", counterSpan), // Place the reactive span here
		userNameP, // The reactive paragraph
		incrementButton,
		changeNameButton,
		{
			// oncreate might be useful for initial setup or complex bindings
			oncreate: (el) => {
				console.log("Component created and bound.");
			}
		}
	);
}

// In your main app:
// document.body.appendChild(MyReactiveComponent());
