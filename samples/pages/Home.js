import { tags } from "seui"
import SampleTimer from "../components/SampleTimer.js"
import SampleDialog from "../components/SampleDialog.js"
import SVGWorld from "../components/SVGWorld.js"
import Navigation from "../components/Navigation.js"
import SampleTimerObservable from "../components/SampleTimerObservable.js"

const { a, p, h1, fragment } = tags

// sample observable component
const observableTimer = SampleTimerObservable({ count: 0, stopAfter: 5 })

export default function Home() {
	return fragment(
		{
			oncreate: (e) => console.log("Home lifecycle (fragment):", e.type),
			onmount: (e) => console.log("Home lifecycle (fragment):", e.type),
			onunmount: (e) => console.log("Home lifecycle (fragment):", e.type),
		},
		h1({
			oncreate: (e) => console.log("Home lifecycle (h1):", e.type),
			onmount: (e) => console.log("Home lifecycle (h1):", e.type),
			onunmount: (e) => console.log("Home lifecycle (h1):", e.type),
		}, SVGWorld(), "SEUI Demo"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/info" }, "Info"),
			a({ href: "#!/scanner" }, "Scanner"),
			a({ href: "#!/contact" }, "Contact"),
			a({ href: "#!/pubsub" }, "PubSub"),
			a({ href: "#!/state-test" }, "State Test"),
			a({ href: `#!/error/${encodeURIComponent("Error: Sample message.")}` }, "Error (sample)"),
			a({ href: "#!/event-driven-observer" }, "Event Driven Observer"),
			a({ href: "#!/observer-pattern" }, "Observer Pattern"),
			a({ href: "#!/observable-proxy" }, "Observable Proxy"),
		),
		p("This page will demonstrate the use of the seui library and its components."),
		// this is an observable, so use value here:
		observableTimer.value,
		// this returns an HTMLElement:
		SampleTimer({
			id: "timer",
			onTick: ({ target, timer, count }) => {
				// log every 10 seconds
				if (count % 10 === 0) {
					console.log("SampleTimer::onTick", { target, timer, count })
				}
				// stop timer after 20 seconds and show dialog
				if (count >= 20) {
					console.log("SampleTimer::stopTimer", { target, timer, count })
					clearInterval(timer)
					/** @type {HTMLDialogElement} */
					// @ts-ignore
					const dialog = document.querySelector("dialog#home-dialog")
					if (dialog) dialog.showModal()
				}
			}
		}),
		SampleDialog({
			id: "home-dialog",
			//open: "open", // UI open at startup
			oncreate: (e) => {
				console.log("SampleDialog::oncreate")
			}
		})
	)
}
