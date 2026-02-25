// sample app with routing
import { tags } from "seui"
import { HistoryRouter } from "seui/router"
import SVGWorld from "./components/SVGWorld.js"

const { a, p, h1, div, pre, nav, fragment } = tags

console.time("Router initialization")
const router = new HistoryRouter();

// setup the router
router.init(document.body, "/", {
	"/": Home, // also the default route
	"/info": Info,
	"/user/:id": (prev, now, state, id) => {
		console.log(`3. Navigated from ${prev} to ${now} with ${id}`, state)
		return div("Hello! You have navigated to the user page with ID: " + id)
	},
	"/album/:id/detail/:type": (prev, now, state, id, type) => {
		console.log(`3. Navigated from ${prev} to ${now} with ${id}`, state)
		return div("Hello! You have navigated to the album detail page with ID: " + id + " and type: " + type)
	},
	"/error": ErrorPage
})

function Home() {
	return fragment(
		{
			oncreate: (e) => {
				// lifecycle event when the element is created
				console.log("Home lifecycle:", e.type)
			},
			onmount: (e) => {
				// lifecycle event when the element is mounted
				console.log("Home lifecycle:", e.type)
			},
			onunmount: (e) => {
				// lifecycle event when the element is unmounted
				console.log("Home lifecycle:", e.type)
			},
		},
		h1(SVGWorld(), "SEUI Demo"),
		nav(
			a({ href: "/" }, "Home"),
			a({ href: "/info" }, "Info"),
			a({ href: "/error" }, "Error (sample)"),
		),
		p("This page will demonstrate the use of the seui library and its components."),
	)
}

function Info() {
	return div(
		{
			oncreate: (e) => {
				// lifecycle event when the element is created
				console.log("Info lifecycle:", e.type)
			},
			onmount: (e) => {
				// lifecycle event when the element is mounted
				console.log("Info lifecycle:", e.type)
			},
			onunmount: (e) => {
				// lifecycle event when the element is unmounted
				console.log("Info lifecycle:", e.type)
			},
		},
		h1("Info"),
		nav(
			a({ href: "/" }, "Home"),
			a({ href: "/info" }, "Info"),
		),
		p("Information..."),
	)
}

function ErrorPage(prev, now, error, ...params) {
	console.log(`\x1b[32m Error route navigated from ${prev} to ${now} with:\x1b[0m`, error, params)
	// take the error message and decode uri component
	// const matches = window.location.hash.match(/#!\/error\/(.+)/)
	// const message = matches == null ? "" : decodeURIComponent(matches[1])
	// const message = $1 ? decodeURIComponent($1) : ""
	const message = JSON.stringify(error, null, 2) || "unknown error"

	return div(
		{
			oncreate: (e) => {
				// lifecycle event when the element is created
				console.log("ErrorPage lifecycle:", e.type)
			},
			onmount: (e) => {
				// lifecycle event when the element is mounted
				console.log("ErrorPage lifecycle:", e.type)
			},
			onunmount: (e) => {
				// lifecycle event when the element is unmounted
				console.log("ErrorPage lifecycle:", e.type)
			},
		},
		h1("Error"),
		nav(
			a({ href: "/" }, "Home"),
			a("Error"),
		),
		p("Details:"),
		pre({ onclick: () => router.go("/", { hello: "world" }) }, message),
	)
}

console.timeEnd("Router initialization")
