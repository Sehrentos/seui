import { tags } from "../../seui.js";
import Navigation from "../components/Navigation.js";
import { appState, stateDispatcher } from "./state-manager.js"; // Import your state manager

const { a, div, p, button, span, h1 } = tags; // Destructure tags from seui.js

/**
 * MyReactiveComponent is a demo of how to create a reactive component
 * by using events dispatched by the state manager.
 *
 * This component will automatically update the displayed count and
 * username when the state manager's values change.
 */
export default function MyReactiveComponent() {
	// Create the elements
	const counterSpan = span(String(appState.counter)); // Initial render
	const userNameP = p("User: ", span(appState.userName)); // Initial render

	// Listen for counter changes
	stateDispatcher.addEventListener('counterChanged', (e) => {
		// @ts-ignore custom event data
		counterSpan.textContent = String(e.detail.newValue);
	});

	// Listen for username changes
	stateDispatcher.addEventListener('userNameChanged', (e) => {
		// Find the inner span that displays the username
		const userNameTextSpan = userNameP.querySelector('span');
		if (userNameTextSpan) {
			// @ts-ignore custom event data
			userNameTextSpan.textContent = String(e.detail.newValue);
		}
	});

	return div(
		h1("Reactive Counter & User (Custom Events)"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/event-driven-observer" }, "Event Driven Observer"),
		),
		p("Demo of how to create a reactive component by using events dispatched by the state manager."),
		p("Current Count: ", counterSpan),
		userNameP,
		button(
			"Increment",
			{
				onclick: () => appState.counter++ // This triggers the setter, which dispatches the event
			}
		),
		button(
			"Change Name",
			{
				onclick: () => appState.userName = appState.userName === 'Guest' ? 'Alice' : 'Guest'
			}
		)
	);
}

// In your main app:
// document.body.appendChild(MyReactiveComponent());
