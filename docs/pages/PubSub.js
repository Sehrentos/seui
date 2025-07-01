import { tags, Observable, onceNavigate } from "../../seui.js"
import Navigation from "../components/Navigation.js"
import { globalState } from "../state.js"

const { a, p, h1, div, span, button } = tags

export default function PubSub() {
	// use the local state
	const counter = new Observable(0)
	const counterSpan = span(counter.value.toString())
	const counterObserver = counter.subscribe(newValue => counterSpan.textContent = newValue.toString())

	// use the global state
	const globalCounterSpan = span(globalState.value.clicks.toString())
	const globalObserver = globalState.subscribe(newValue =>
		globalCounterSpan.textContent = newValue.clicks.toString()
	)

	// cleanup routine on route change
	// this will trigger when the user navigates to another page
	onceNavigate((e) => {
		console.log(`PubSub::cleanup from: ${e.oldURL} to: ${e.newURL}`)
		globalState.unsubscribe(globalObserver)
		counter.unsubscribe(counterObserver)
	})

	return div(
		h1("PubSub"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/pubsub" }, "PubSub"),
		),
		p("Observable pattern test..."),
		p("Counter (global): ", globalCounterSpan),
		p("Counter (local): ", counterSpan),
		button("Increment", {
			onclick: () => {
				counter.update(c => c + 1)
				globalState.update(oldVal => ({ // update the global state object
					...oldVal,
					clicks: oldVal.clicks + 1,
				}))
			}
		}),
	)
}
