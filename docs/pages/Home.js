import { tags } from "../../seui.js"
import SampleTimer from "../components/SampleTimer.js"
import SampleDialog from "../components/SampleDialog.js"
import SVGWorld from "../components/SVGWorld.js"
import Navigation from "../components/Navigation.js"

const { a, b, p, h1, ol, li, fragment } = tags

export default function Home() {
	return fragment(
		{ // sample lifecycle events
			oncreate: (e) => {
				// lifecycle event when the element is created
				console.log("Home lifecycle:", e.type)
			},
			onmount: (e) => {
				// lifecycle event when the element is mounted
				console.log("Home lifecycle:", e.type)
			},
			onunmount: (e) => {
				// lifecycle event when the element is unmounted
				console.log("Home lifecycle:", e.type)
			},
		},
		h1(SVGWorld(), "SEUI Demo"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/info" }, "Info"),
			a({ href: "#!/contact" }, "Contact"),
			a({ href: "#!/pubsub" }, "PubSub"),
			a({ href: "#!/state-test" }, "State Test"),
			a({ href: `#!/error/${encodeURIComponent("Error: Sample message.")}` }, "Error (sample)"),
			a({ href: "#!/event-driven-observer" }, "Event Driven Observer"),
			a({ href: "#!/observer-pattern" }, "Observer Pattern"),
			a({ href: "#!/observable-proxy" }, "Observable Proxy"),
		),
		p("This page will demonstrate the use of the seui library and its components."),
		p("More examples:",
			ol(
				li(a({ href: "/docs/userprofile/" }, "/docs/userprofile/")),
			)
		),
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
