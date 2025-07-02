// sample app with routing
import { tags, router, State } from "../../seui.js"
const { a, p, h1, ol, li, button, fragment } = tags

console.time("init simple app")

// setup the router
router.init(document.body, "/", {
	"/": () => HomeView(),
	"/users": () => UsersView(),
	"#!/user/(\\d+)": (_, newURL, userId) => UserProfileView(userId), // uses RegExp match group
	"#!/error/(.+)": (oldURL, newURL, message) => {
		console.error(`Route Error from ${oldURL} to ${newURL} with ${message}`)
		return fragment(
			tags.div("Error! You have navigated to the error page."),
			tags.pre(decodeURIComponent(message))
		)
	},
})

function HomeView() {
	return fragment(
		h1("Welcome!"),
		p("This is the homepage of the user profile app."),
		button({ onclick: () => router.go("#!/users") }, "Go to Users")
	)
}

function UsersView() {
	return fragment(
		h1("Users"),
		p("Select a dummy user."),
		ol(
			li(a({ href: "#!/user/1" }, "User 1")),
			li(a({ href: "#!/user/2" }, "User 2")),
			li(a({ href: "#!/user/123" }, "User 123"))
		),
		button({ onclick: () => router.back() }, "Back")
	)
}

function UserComponent(user) {
	return user == null || user.id < 0
		? p("Dummy user data loading...")
		: fragment(
			p(`User ID: ${user.id}`),
			p(`User Name: ${user.name}`),
			p(`User Age: ${user.age}`)
		)
}

function UserProfileView(userId) {
	const user = State({ id: -1, name: "Unknown", age: -1 }, true)

	const userStateComponent = UserComponent(user)

	// Subscribe to change in user 'id'
	// If the user 'id' changes, update the userComponent
	// If 'id' key is not specified, the callback will be called on any change
	const unsubscribeUserId = user.subscribe((obj, key, oldValue, newValue) => {
		console.log("User updated:", obj, key, oldValue, newValue)
		// update the user component
		userStateComponent.replaceChildren(UserComponent(user))
	}, 'id')

	return fragment(
		{
			onmount: async () => {
				console.log("Mounting UserView...")
				// simulate async data fetching before the render
				const data = await fetchData(userId)
				console.log("Fetched user data:", data)
				user.id = data.id
				user.name = data.name
				user.age = data.age
			},
			onunmount: () => {
				console.log("Unmounting UserView...")
				// Also abort any async data fetching here
				unsubscribeUserId()
			}
		},
		h1("User Profile"),
		userStateComponent,
		button({ onclick: () => router.back() }, "Back")
	)
}

async function fetchData(userId) {
	// simulate async data fetching
	await new Promise((resolve) => setTimeout(resolve, 1000))
	return [
		{ id: 1, name: "Alice", age: 23 },
		{ id: 2, name: "Bob", age: 25 },
		{ id: 123, name: "Charlie", age: 27 },
	].find((user) => user.id == userId)
}
console.timeEnd("init simple app")
