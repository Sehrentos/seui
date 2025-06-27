import { tags } from "../seui.js"
import Navigation from "../components/Navigation.js"

const { a, p, h1, div } = tags

export default function Info() {
	return div(
		h1("Info"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/info" }, "Info"),
		),
		p("Information..."),
	)
}
