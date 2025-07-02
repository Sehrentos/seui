import { tags, router, Observable } from "../../seui.js"
import Navigation from "../components/Navigation.js"
import { globalState } from "../state.js"

const { a, p, h1, div, span, button } = tags

export default function PubSub() {
	// use the local state
	const counter = new Observable(0)
	const counterSpan = span(counter.value.toString())
	const unsubscribeCounter = counter.subscribe(newValue => counterSpan.textContent = newValue.toString())

	// use the global state
	const globalCounterSpan = span(globalState.value.clicks.toString())
	const unsubscribeGlobal = globalState.subscribe(newValue =>
		globalCounterSpan.textContent = newValue.clicks.toString()
	)

	// subscribe to the router state observable
	// and unsubscribe when leaving the page
	const unsubscribeRouter = router.state.subscribe(({ newURL, oldURL }) => {
		console.log("Route change:", newURL, oldURL)
		// cleanup listeners
		if (oldURL.endsWith("#!/pubsub")) { // leaving the current page
			console.log("PubSub::cleanup listeners")
			unsubscribeGlobal()
			unsubscribeCounter()
			unsubscribeRouter()
		}
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
