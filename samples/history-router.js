// sample app with history routing
import { tags, addStyle } from "seui"
import { HistoryRouter } from "seui/router"
import state from "./state.js"
import SVGWorld from "./components/SVGWorld.js"

const { a, p, h1, div, pre, nav, button, fragment } = tags

// define routes
// pass observable state object for subscribers
const router = new HistoryRouter(document.body, "/", {
	"/": Home, // also the default route
	"/info": Info,
	"/user/:id": (prev, now, id) => fragment(
		div("Hello! You have navigated to the user page with ID: " + id),
		button({ onclick: () => router.back() }, "Go back"),
	),
	"/album/:id/detail/:type": (prev, now, id, type) => fragment(
		div("Hello! You have navigated to the album detail page with ID: " + id + " and type: " + type),
		button({ onclick: () => router.back() }, "Go back"),
	),
	"/test": () => "Not a Node test.",
	"/error/:message": ErrorPage, // error route to handle error
	"/test-throw-route-error": () => { // test only.
		// this demonstrate how the router handles errors thrown in route callbacks
		// and navigates to the error route with the error message
		throw new Error("This is a test error thrown from the route callback for testing the error route.");
	}
}, state.routerState)

// optional. subscribe to global router state changes
// or directly from: state.routerState
router.state?.subscribe((current) => {
	console.log('App router state changed: ', current)
})

// sample: update the router every 5 seconds with data
// this will re-render the current route and trigger the lifecycle methods & state observers
// let counter = setInterval(() => router.update({ sample: Math.random() }), 5000)

// this will update the router state and notify the subscribers, but not re-render
let counter = setInterval(() => router.state?.update(oldVal => ({ ...oldVal, data: { sample: Math.random() } })), 5000)

// stop the counter interval
setTimeout(() => clearInterval(counter), 10000)

// optional. add extra styles
addStyle(
	// { href: "./docs/style.css", rel: "stylesheet", type: "text/css" },
	`
	/* Target the first anchor tag inside the nav */
	nav a:first-of-type::before {
		content: "⟨";
		font-size: 1em;
		font-weight: bold;
		color: #ef5a00;
		position: relative;
		top: -2px;
		right: 2px;
	}
	/* Target the last anchor tag inside the nav */
	nav a:last-of-type::after {
		content: "⟩";
		font-size: 1em;
		font-weight: bold;
		color: #ef5a00;
		position: relative;
		top: -2px;
		left: 2px;
	}
	nav a {
		margin: 0 2px;
	}
	nav a::after {
		content: "›";
		margin-left: 4px;
	}
`
)

function Home() {
	return fragment(
		h1(SVGWorld(), "SEUI Demo"),
		nav(
			a("Home"),
			a({ href: "/info" }, "Info"),
			a({ href: "/error/sample" }, "Error (sample)"),
			a({ href: "/user/123" }, "User 123"),
			a({ href: "/album/456/detail/full" }, "Album 456 Detail Full"),
		),
		p("This page will demonstrate the use of the seui library and its components."),
		a({ href: "/test-throw-route-error" }, "Test faulty route (should navigate to error route)")
	)
}

function Info() {
	return div(
		h1("Info"),
		nav(
			a({ href: "/" }, "Home"),
			a("Info"),
		),
		p("Information..."),
	)
}

function ErrorPage(prev, now, message) {
	console.log(`\x1b[32m Error route navigated from ${prev} to ${now} with:\x1b[0m`, message)
	// get error message and decode uri component
	const messageError = JSON.stringify(decodeURIComponent(message), null, 2) || "unknown error"
	return div(
		h1("Error"),
		nav(
			a({ href: "/" }, "Home"),
			a("Error"),
		),
		p("Details:"),
		pre(messageError),
		button({ onclick: () => router.back() }, "Go back")
	)
}
