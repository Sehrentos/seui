import { tags, fragment } from "../../../seui.js"
import SampleTimer from "../components/SampleTimer.js"
import SampleDialog from "../components/SampleDialog.js"
import SVGWorld from "../components/SVGWorld.js"

const { a, b, p, h1, nav } = tags

export default function Home() {
	return fragment(
		h1("Heading 1"),
		nav(
			"› Home › ",
			a({ href: "#!/info" }, "Info"),
			" | ",
			a({ href: "#!/contact" }, "Contact"),
			" | ",
			a({ href: `#!/error/${encodeURIComponent("Error: Sample message.")}` }, "Error (sample)"),
		),
		p({ style: { display: "flex" } },
			"Hello",
			SVGWorld(),
		),
		p("Paragraph, ", b("BoldText", { style: { color: "red" } })),
		SampleTimer({
			id: "timer",
			onTick: ({ target, timer, count }) => {
				// log every 10 seconds
				if (count % 10 === 0) {
					console.log("SampleTimer::onTick", { target, timer, count })
				}
				// stop timer after 60 seconds and show dialog
				if (count >= 60) {
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
			oncreate: (el) => {
				console.log("SampleDialog::oncreate")
			}
		})
	)
}
