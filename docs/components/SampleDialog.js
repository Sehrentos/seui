import { tags } from "../../SeUI.js"

const { p, h1, dialog } = tags

export default function SampleDialog(props = {}) {
	return dialog(
		{
			onclick: (e) => {
				// closing the dialog
				if (e.currentTarget.close) e.currentTarget.close()
				e.currentTarget.removeAttribute("open")
			},
			...props
		},
		h1("Dialog title"),
		p("Dialog paragraph..."),
	)
}
