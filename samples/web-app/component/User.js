import { tags } from "seui"
import state from '../context/app.js'
import users from '../context/users.js'

const { fragment, h1, p, button, ol, li } = tags

export function UsersView() {
	return fragment(
		h1('Users'),
		p('Select a dummy user.'),
		p('Each button here will pass data when navigating.'),
		ol(...users.value.map((user) =>
			li(
				button(
					{ onclick: () => state.navigateTo(`/user/${user.id}`) },
					`User ${user.id}`
				)
			)
		)),
		button({ onclick: () => state.back() }, 'Back'),
	)
}

/**
 * @param {{ userId:number }} props
 */
export function UserView({ userId }) {
	const user = users.value.find(u => u.id === Number(userId))
	return fragment(
		h1('User'),
		(user == null || user.id < 0
			? p('No user data exist.')
			: fragment(
				p(`User ID: ${user.id}`),
				p(`User Name: ${user.name}`),
				p(`User Age: ${user.age}`),
			)
		),
		button({ onclick: () => state.back() }, 'Back'),
	)
}
