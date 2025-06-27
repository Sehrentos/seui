import { tags } from "../../../seui.js"

/**
 * Navigation component
 *
 * @param  {...any} props
 * @example Navigation(
 *   a({ href: "#!/" }, "Home"),
 *   a({ href: "#!/about" }, "About"),
 *   a("Contact (disabled)"),
 * )
 */
export default function Navigation(...props) {
	const firstLink = props[0] // a({ href: "#!/" }, "Home")
	const restLinks = props.slice(1)
	const elements = ["› ", firstLink, " › "]

	// add the rest links separated by " | " to the elements array,
	// but last item does not have separator
	for (let i = 0; i < restLinks.length; i++) {
		if (i === restLinks.length - 1) {
			elements.push(restLinks[i])
		} else {
			elements.push(restLinks[i], " | ")
		}
	}

	// disable the current active link by location.hash from elements list
	const currentHash = location.hash
	for (let i = 0; i < elements.length; i++) {
		if (!(elements[i] instanceof Element)) continue // skip non-Element
		if (elements[i].href.endsWith(currentHash)) {
			elements[i].removeAttribute("href")
		}
	}

	return tags.nav(...elements)
}
