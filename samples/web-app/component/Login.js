import { tags } from "seui"
import state from '../context/app.js'

const { button } = tags

export function LoginButton() {
	const text = () => (state.logged ? 'Do logout' : 'Do login')

	const ui = button(
		{
			onclick: (e) => {
				// state.logged = !state.logged // single update to trigger reactivity
				// multiple updates can be done in one go like this:
				state.update((s) => ({
					...s,
					logged: !s.logged,
					counter: s.counter + 1,
					timestamp: Date.now()
				}))
				ui.textContent = text()
			},
		},
		text(),
	)

	return ui
}
