import { tags } from "../../../seui.js"

const { a, nav } = tags

/**
 *
 * @param  {...any} props
 * @example Navigation({ onclick: (e) => { console.log(e.type, e) } })
 */
export default function Navigation(...props) {
	return nav(
		a({ href: "#!/" }, "Home"),
		" | ",
		a({ href: "#!/info" }, "Info"),
		" | ",
		a({ href: "#!/contact" }, "Contact"),
		...props
	)
}
