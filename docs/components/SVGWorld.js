import { ns } from "../seui.js"

/**
 * svg world icon
 */
export default function SVGWorld() {
	return ns("http://www.w3.org/2000/svg", "svg", {
		oncreate: (svg) => { // demonstrate custom oncreate function
			svg.classList.add("anim-spin") // optional. animate
			svg.setAttribute("aria-hidden", "true")
			svg.setAttribute('viewbox', '0 0 24 24')
			svg.setAttribute("width", "24px")
			svg.setAttribute("height", "24px")
			//svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
			svg.append(
				ns("http://www.w3.org/2000/svg", "path", {
					oncreate: (path) => {
						path.setAttribute("d", "M0 0h24v24H0z")
						path.setAttribute("fill", "none")
					}
				}),
				ns("http://www.w3.org/2000/svg", "path", {
					oncreate: (path) => {
						path.setAttribute("d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z")
						path.setAttribute("fill", "#2962ff")
					}
				})
			)
		}
	})
}
