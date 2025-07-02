// sample app with routing
import { tags, router } from "../seui.js"
import Home from "./pages/Home.js"
import Info from "./pages/Info.js"
import Contact from "./pages/Contact.js"
import PubSub from "./pages/PubSub.js"
import ErrorPage from "./pages/ErrorPage.js"
import MyReactiveComponent from "./event-driven-observer/MyReactiveComponent.js"
import MyReactiveComponentWithObserver from "./observer-pattern/MyReactiveComponentWithObserver.js"
import MyReactiveComponentWithProxy from "./observable-proxy/MyReactiveComponentWithProxy.js"
import StateTest from "./pages/StateTest.js"

console.time("init")

// note: you can create new instance and extract the router to a separate file e.g. router.js,
// when you need to access it, import it and use it in multiple places
// const router = new Router()

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
// router.state.subscribe((newVal, oldVal) => {
// 	console.table({ newState: newVal, oldState: oldVal })
// })

// setup the router
router.init(document.body, "/", {
	"/": Home, // also the default route
	"/info": Info,
	"/contact": Contact,
	"/pubsub": PubSub, // observable tests
	"/state-test": StateTest,
	"/event-driven-observer": MyReactiveComponent, // event driven observer sample
	"/observer-pattern": MyReactiveComponentWithObserver, // observable sample
	"/observable-proxy": MyReactiveComponentWithProxy, // proxy sample
	"#!/sample/(.*)": (prev, now, $1) => { // uses RegExp search
		console.log(`3. Navigated from ${prev} to ${now} with ${$1}`)
		document.body.replaceChildren(tags.div("Hello! You have navigated to the sample page."))
		return false // stop further processing
	},
	// sample error route
	// "#!/error/(.+)": (prev, now, $1) => { // custom error route
	// 	console.log(`Error route navigated from ${prev} to ${now} with ${$1}`)
	// 	// take the error message and decode uri component
	// 	const message = $1 ? decodeURIComponent($1) : ""
	// 	document.body.replaceChildren(tags.div("Error! You have navigated to the error page."), tags.pre(message))
	// 	return false // stop further processing
	// },
	// sample error page
	"#!/error/(.+)": ErrorPage, // (prev, now, $1) => ErrorPage(prev, now, $1),
})

console.timeEnd("init")
