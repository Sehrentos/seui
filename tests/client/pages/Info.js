import { tags } from "../../../seui.js"

const { a, p, h1, div, nav } = tags

export default function Info() {
	return div(
		h1("Info"),
		nav(
			a({ href: "#!/" }, "› Home"),
			" › Info",
		),
		p("Information..."),
	)
}
