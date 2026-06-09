import { tags, signal, effect, computed } from "seui"
import { HistoryRouter } from "seui/router"
import { LoginButton } from "./component/Login.js"
import { UserView, UsersView } from "./component/User.js"
import state from './context/app.js'

const { fragment, pre, button, h1, p, text } = tags

// optional.
// import { addStyle } from "seui"
// addStyle(/*{ rel: "stylesheet", type: "text/css", href: "./styles.css" }, */`
//   body {
//     margin: 0;
//     font-family: Arial, sans-serif;
//   }
// `);

const count = signal(0)
// when count is even, color is blue, otherwise red
const color = computed(() => {
	console.log("Computing color")
	return count.value % 2 === 0 ? "blue" : "red"
});
// effect sample: log count changes
effect(() => {
	console.log("Count changed:", count.value)
})

// optional.
// const textSpan = span(count)
// effect(() => textSpan.textContent = count.value.toString())

// Initialize the router and define routes.
// The router instance is stored in the app state for potential use in components or state logic.
state.router = new HistoryRouter(document.body, "/", {
	'/': App,
	'/user/all': () => state.logged
		? UsersView()
		: text(`Unauthorized. Please login first.`),
	'/user/:id': (_prevUri, _nowUri, userId) => state.logged
		? UserView({ userId: Number(userId) })
		: text(`Unauthorized. Please login first.`),
	'/error/:code': (_prevUri, _nowUri, code) =>
		pre(`Error:\n${JSON.stringify(decodeURIComponent(code), null, 2)}`),
}, state.route);

// Root component of the app, displayed at the "/" route.
function App() {
	return fragment(
		h1({
			oncreate: (e) => console.log(e.type, e.target),
			onmount: (e) => console.log(e.type, e.target),
			onunmount: (e) => console.log(e.type, e.target),
		}, 'Welcome!'),
		p('This is the homepage of the user profile app.'),
		p(`This will demonstrate passing data with "router.go" and reading from "router.state".`),
		p({
			oncreate: (e) => console.log(e.type, e.target),
			onmount: (e) => console.log(e.type, e.target),
			onunmount: (e) => console.log(e.type, e.target),
		}, `Signal counter:`, count),
		button("Increment", {
			onclick: (e) => {
				// e.stopPropagation();
				// count.value = count.value + 1
				count.value++
			},
			style: { color: color } // Computed signal drives the style
		}),
		LoginButton(),
		button({ onclick: () => state.router?.go('/user/all') }, 'Go to Users'),
	)
}

// helper function to validate before route change
// async function validateBeforeRouteChange(validator, onsuccess, onfailure) {
// 	try {
// 		await validator()
// 		return onsuccess()
// 	} catch (error) {
// 		return onfailure(error)
// 	}
// }

