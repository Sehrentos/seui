import { tags } from "../../seui.js"

const { p, h1, dialog } = tags

export default function SampleDialog(props = {}) {
	return dialog(
		{
			onclick: (e) => {
				/** @type {HTMLDialogElement} */
				// @ts-ignore
				const _dialog = e.currentTarget
				if (_dialog.close) _dialog.close()
				_dialog.removeAttribute("open")
			},
			...props
		},
		h1("Dialog title"),
		p("This is a sample Dialog.."),
		p("Click any where to close.")
	)
}
