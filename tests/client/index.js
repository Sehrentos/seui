// seui esm sample
import { tags, router } from "../../seui.js"
import Home from "./pages/Home.js"
import Info from "./pages/Info.js"
import Contact from "./pages/Contact.js"
import ErrorPage from "./pages/ErrorPage.js"
import MyReactiveComponent from "./event-driven-observer/MyReactiveComponent.js"
import MyReactiveComponentWithObserver from "./observer-pattern/MyReactiveComponentWithObserver.js"
import MyReactiveComponentWithProxy from "./observable-proxy/MyReactiveComponentWithProxy.js"

console.time("#app-start")

// initialize the app using router
// this will handle the routing based on the URL hash
// and render the corresponding page
router(document.body, "/", {
	"/": Home, // also the default route
	"/info": Info,
	"/contact": Contact,
	"/event-driven-observer": MyReactiveComponent, // event driven observer sample
	"/observer-pattern": MyReactiveComponentWithObserver, // observable sample
	"/observable-proxy": MyReactiveComponentWithProxy, // proxy sample
	"#!/sample/(.*)": (prev, now) => { // uses RegExp search
		console.log(`3. Navigated from ${prev} to ${now}`)
		document.body.replaceChildren(tags.div("Hello! You have navigated to the sample page."))
		return false // stop further processing
	},
	// sample error route
	// "#!/error/(.+)": (prev, now) => { // custom error route
	// 	console.log(`Error route navigated from ${prev} to ${now}`)
	// 	// take the error message and decode uri component
	// 	const matches = now.match(/#!\/error\/(.+)/)
	// 	const message = matches == null ? "" : decodeURIComponent(matches[1])
	// 	document.body.replaceChildren(tags.div("Error! You have navigated to the error page."), tags.pre(message))
	// 	return false // stop further processing
	// },
	// sample error page
	"#!/error/(.+)": ErrorPage,
})

console.timeEnd("#app-start")
