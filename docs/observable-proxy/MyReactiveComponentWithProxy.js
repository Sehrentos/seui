import { tags } from "../seui.js";
import Navigation from "../components/Navigation.js";
import createReactive from "./createReactive.js";

const { a, p, h1, div, button } = tags;
const { reactive, effect } = createReactive();

// --- TODO/IDEA: Integration with seui.js ---
// We need a way for our UI elements to be "rendered" by an effect

// This would be a specialized function to create reactive elements
// function createReactiveText(reactiveObject, propName) {
// 	const textNode = document.createTextNode('');
// 	effect(() => {
// 		textNode.nodeValue = String(reactiveObject[propName]);
// 	});
// 	return textNode;
// }

// function createReactiveElement(tag, children, props) {
// 	const el = document.createElement(tag);
// 	// Process static children/props
// 	processChildren(el, children); // This part handles non-reactive items

// 	// Now, handle reactive text/attributes
// 	const reactiveProps = {};
// 	const staticChildren = [];

// 	// Separate reactive from static children/props
// 	children.forEach(child => {
// 		if (child instanceof ReactiveTextBinding) { // A custom marker for reactive text
// 			el.appendChild(child.textNode);
// 		} else {
// 			// Re-process static children, but need to be careful not to double add
// 			// This is simplified. In a real framework, rendering would be smarter.
// 			if (typeof child === "string" || child instanceof String || child instanceof Element) {
// 				staticChildren.push(child);
// 			} else if (child.constructor === Object) {
// 				Object.assign(reactiveProps, child); // Props passed as objects
// 			}
// 		}
// 	});

// 	// A more advanced approach would involve a 'render effect' for components:
// 	// When a component is mounted, its render function runs inside an effect.
// 	// Any reactive data accessed during this render function automatically becomes a dependency.
// 	// When that reactive data changes, the entire render function re-runs, and the DOM is diffed/patched.

// 	// For now, let's keep it simple with specific binders
// 	return el;
// }

// Our reactive state
const state = reactive({
	counter: 0,
	userName: 'Guest'
});

// A wrapper to create a text node that reacts to a specific property
function reactiveText(reactiveObj, propName) {
	const textNode = document.createTextNode('');
	// The effect function will run initially and re-run whenever state[propName] changes
	effect(() => {
		textNode.nodeValue = String(reactiveObj[propName]);
	});
	return textNode;
}

export default function MyReactiveComponentWithProxy() {
	return div(
		h1("Reactive Counter & User (Proxy)"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/observable-proxy" }, "Observable Proxy"),
		),
		p("Demo of how to create a reactive component by using a Proxy."),
		p(
			"Current Count: ",
			reactiveText(state, 'counter') // Directly bind text to state.counter
		),
		p(
			"User: ",
			reactiveText(state, 'userName') // Directly bind text to state.userName
		),
		button(
			{
				onclick: () => state.counter++ // Directly modify, Proxy intercepts!
			},
			"Increment",
		),
		button(
			{
				onclick: () => state.userName = state.userName === 'Guest' ? 'Alice' : 'Guest'
			},
			"Change Name",
		)
	);
}
