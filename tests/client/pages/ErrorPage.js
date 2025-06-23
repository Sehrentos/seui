import { tags } from "../../../seui.js"

const { a, p, h1, div, nav, pre } = tags

export default function ErrorPage() {
	// take the error message and decode uri component
	const matches = window.location.hash.match(/#!\/error\/(.+)/)
	const message = matches == null ? "" : decodeURIComponent(matches[1])

	return div(
		h1("Error"),
		nav(
			a({ href: "#!/" }, "› Home"),
			" › Error",
		),
		p("Details:"),
		pre(message),
	)
}
