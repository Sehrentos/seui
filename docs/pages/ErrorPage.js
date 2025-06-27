import { tags } from "../seui.js"
import Navigation from "../components/Navigation.js"

const { a, p, h1, div, pre } = tags

export default function ErrorPage() {
	// take the error message and decode uri component
	const matches = window.location.hash.match(/#!\/error\/(.+)/)
	const message = matches == null ? "" : decodeURIComponent(matches[1])

	return div(
		h1("Error"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a("Error"),
		),
		p("Details:"),
		pre(message),
	)
}
