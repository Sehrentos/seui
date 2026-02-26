// app entry point
// import { addStyle } from "seui"
import { HashRouter } from "seui/router"
import { routerState } from "./state.js"
import Home from "./pages/Home.js"
import Info from "./pages/Info.js"
import Contact from "./pages/Contact.js"
import PubSub from "./pages/PubSub.js"
import ErrorPage from "./pages/ErrorPage.js"
import MyReactiveComponent from "./event-driven-observer/MyReactiveComponent.js"
import MyReactiveComponentWithObserver from "./observer-pattern/MyReactiveComponentWithObserver.js"
import MyReactiveComponentWithProxy from "./observable-proxy/MyReactiveComponentWithProxy.js"
import StateTest from "./pages/StateTest.js"

// Single instance router for the app
const router = new HashRouter(document.body, "/", {
	"/": Home, // also the default route
	"/info": Info,
	"/contact": Contact,
	"/pubsub": PubSub, // observable tests
	"/state-test": StateTest,
	"/event-driven-observer": MyReactiveComponent, // event driven observer sample
	"/observer-pattern": MyReactiveComponentWithObserver, // observable sample
	"/observable-proxy": MyReactiveComponentWithProxy, // proxy sample
	// "/sample/:value": (prev, now, value) => { // uses RegExp search
	// 	console.log(`3. Navigated from ${prev} to ${now} with ${value}`)
	// 	document.body.replaceChildren(tags.div("Hello! You have navigated to the sample page."))
	// 	return false // stop further processing
	// },
	// sample error route
	// "/error/:message": (prev, now, message) => { // custom error route
	// 	console.log(`Error route navigated from ${prev} to ${now} with ${message}`)
	// 	// take the error message and decode uri component
	// 	const message = message ? decodeURIComponent(message) : ""
	// 	document.body.replaceChildren(tags.div("Error! You have navigated to the error page."), tags.pre(message))
	// 	return false // stop further processing
	// },
	// sample error page
	"/error/:message": ErrorPage,
}, routerState)

// to manually update the router or do a refresh (repaint the page)
// router.update()

// to move to a specific route use:
// router.go("#!/info")
// equivalent to:
// window.location.hash = "#!/info"

// to move back in the browser history
// router.back()
// equivalent to:
// window.history.back()

// to remove the router listeners
// router.remove()

// subscribe to global router state changes
// router.state?.subscribe((newVal, oldVal) => {
// 	console.table({ newState: newVal, oldState: oldVal })
// })

// optional. add extra styles
// addStyle(
// 	{ href: "./docs/style.css", rel: "stylesheet" },
// )

// optional. subscribe to global router state changes
routerState.subscribe((current) => {
	console.log('App router state changed: ', current)
})

// sample: update the router every 5 seconds with data
// this will re-render the current route and trigger the lifecycle methods & state observers
// let counter = setInterval(() => router.update({ sample: Math.random() }), 5000)

// this will update the router state and notify the subscribers, but not re-render
// let counter = setInterval(() => router.state?.update(oldVal => ({ ...oldVal, data: { sample: Math.random() } })), 5000)

// stop the counter interval
// setTimeout(() => clearInterval(counter), 10000)
