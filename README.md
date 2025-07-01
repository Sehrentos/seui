# seui - Simple, Expressive UI Utilities
seui is a lightweight, modular JavaScript library providing essential utilities
for building reactive and dynamic web user interfaces without the overhead
of a full-blown framework. It focuses on composability and direct control
over the DOM, leveraging modern browser APIs.

1. See live demo page [here](https://sehrentos.github.io/seui/) hosted by the github pages.
2. Explore the sample source code in the [docs/index.js](docs/index.js).
3. Try the editable live version on [JSFiddle](https://jsfiddle.net/Sehrentos/bhamrxg9/).

---

> [!WARNING]
> This is a **demo only**. Expect bugs and unfinished functionality.

## Table of Contents
-----------------

- [seui - Simple, Expressive UI Utilities](#seui---simple-expressive-ui-utilities)
	- [Table of Contents](#table-of-contents)
	- [Key Features](#key-features)
	- [Installation](#installation)
	- [Usage Examples](#usage-examples)
		- [1. Declarative HTML with `tags`](#1-declarative-html-with-tags)
		- [2. Namespaced Tags (e.g., SVG)](#2-namespaced-tags-eg-svg)
		- [3. Client-Side Routing with router](#3-client-side-routing-with-router)
		- [4. Reactive State with Observable](#4-reactive-state-with-observable)
		- [5. Deep Reactive State with State](#5-deep-reactive-state-with-state)
		- [6. Custom lifecycle Events](#6-custom-lifecycle-events)
		- [7. Sample App](#7-sample-app)
	- [Documentation](#documentation)
	- [Contributing](#contributing)
	- [License](#license)

## Key Features
- Declarative HTML with Tags:
  - Create DOM elements directly in JavaScript using a simple functional API, making your UI structure explicit and composable.
  - Supports standard HTML tags and also provides namespaces for creating SVG and MathML elements.
- Powerful Client-Side Router:
  - A single-instance hash-based router for managing application views.
  - Supports both exact string matches (e.g., `/path`) and flexible regular expression patterns (e.g., `#!/users/(\d+)`).
  - Integrates with component lifecycle for automatic cleanup (**To-Do**) when routes change.
- Reactive State Management (Observable):
  - A basic, traditional publish-subscribe pattern for managing single values or simple data streams. Ideal for granular reactivity where explicit updates are desired.
- Deep Reactive State Management (State):
  - An advanced, Proxy-based system that automatically observes changes in JavaScript objects and arrays, including nested properties.
  - Enables automatic UI updates by reacting to direct property assignments, offering a powerful and intuitive way to manage application state without explicit update() calls for every change.

## Installation
---------------
For now, you can directly import them into your project:
```html
<script type="module" src="./seui.js"></script>
```
```javascript
// In your main JavaScript file (e.g., app.js)
import { tags, router, State, Observable } from './seui.js';
```

## Usage Examples

### 1. Declarative HTML with `tags`

Create and append HTML elements easily.

```javascript
import { tags } from './seui.js'
const { h1, div, button, fragment } = tags

const App = () => {
  return fragment(
	div({ className: 'header' },
		h1("Sample app"),
	),
    button("Click Me", {
		id: 'myButton',
		onclick: () => alert('Button clicked!'),
		style: {
			backgroundColor: 'lightblue'
		}
	})
  )
}

document.body.appendChild(App())
```

### 2. Namespaced Tags (e.g., SVG)

> [!NOTE]
> TODO: Improve this section!

Create SVG elements with proper namespaces.
```javascript
import { ns } from "../../seui.js"

/**
 * svg world icon
 */
export default function SVGWorld() {
	return ns("http://www.w3.org/2000/svg", "svg", {
		oncreate: (svg) => { // demonstrate custom oncreate function
			svg.classList.add("anim-spin") // optional. animate
			svg.setAttribute("aria-hidden", "true")
			svg.setAttribute('viewbox', '0 0 24 24')
			svg.setAttribute("width", "24px")
			svg.setAttribute("height", "24px")
			//svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
			svg.append(
				ns("http://www.w3.org/2000/svg", "path", {
					oncreate: (path) => {
						path.setAttribute("d", "M0 0h24v24H0z")
						path.setAttribute("fill", "none")
					}
				}),
				ns("http://www.w3.org/2000/svg", "path", {
					oncreate: (path) => {
						path.setAttribute("d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z")
						path.setAttribute("fill", "#2962ff")
					}
				})
			)
		}
	})
}
```

### 3. Client-Side Routing with router

Set up routes and navigate through your single-page application.

```javascript
import { tags, router } from './seui.js';

const appRoot = document.getElementById('app-root'); // Your main application container

// Dummy page components (in a real app, these would be more complex)
const Navigation = () => tags.nav(a({ href: "#!/" }, "Home"), a({ href: "#!/about" }, "About"))
const HomePage = () => tags.div(
	Navigation(),
	tags.h1('Welcome Home!'),
	tags.p('This is the homepage.'),
	tags.button({ onclick: () => router.go('#!/about') }, 'Go to About')
);
const AboutPage = () => tags.div(
	Navigation(),
	tags.h1('About Us'),
	tags.p('Learn more about seui.'),
	tags.button({ onclick: () => router.go('#!/user/123') }, 'Show profile: 123')
);
const UserProfilePage = (userId) => tags.div(tags.h1(`User Profile for ID: ${userId}`));

router.init(appRoot, "/", {
  // Simple string routes
  "/": HomePage,
  "/about": () => AboutPage(),
  // RegExp route for dynamic paths, the callback receives `prevUrl` and `nowUrl`
  "#!/user/(\\d+)": (prev, now, userId) => {
    return UserProfilePage(userId || 'Unknown');
  },
  // Error route fallback
  "#!/error/(.+)": (prev, now, message) => {
    const errorMessage = decodeURIComponent(message);
    return tags.div(tags.h1('Error!'), tags.p(`Page not found or error: ${errorMessage}`));
  },
});
```

### 4. Reactive State with Observable

Manage simple, isolated reactive values.

```javascript
import { Observable } from './seui.js';

const counter = new Observable(0);
const statusMessage = new Observable('Ready');

// Subscribe to changes
counter.subscribe((newVal, oldVal) => {
  document.getElementById('counter-display').textContent = `Count: ${newVal}`;
  console.log(`Counter changed from ${oldVal} to ${newVal}`);
});

statusMessage.subscribe((newMsg) => {
  document.getElementById('status-display').textContent = `Status: ${newMsg}`;
});

// Update the values
document.getElementById('increment-btn').addEventListener('click', () => {
  counter.update(c => c + 1); // Using an updater function
});

setTimeout(() => {
  statusMessage.value = 'Processing...'; // Using the setter
}, 1000);

setTimeout(() => {
  statusMessage.update('Done!'); // Using the update method directly
  counter.value = 10;
}, 2000);
```

### 5. Deep Reactive State with State

Manage complex, nested data structures with automatic change detection.

```javascript
import { State } from './seui.js';

const appState = State({
  user: {
    firstName: 'Jane',
    lastName: 'Doe',
    address: { street: '123 Main St', city: 'Anytown' }
  },
  products: ['Laptop', 'Mouse'],
  isLoggedIn: false
});

// Subscribe to ANY change in the entire appState
appState.subscribe((obj, key, oldVal, newVal) => {
  console.log(`[Global Change] Property '${String(key)}' changed.`, obj);
});

// Subscribe to a specific property of the top-level object
appState.subscribe((obj, key, oldVal, newVal) => {
  console.log(`[Login Status] User login state: ${newVal ? 'Logged In' : 'Logged Out'}`);
}, 'isLoggedIn');

// Subscribe to a specific property of a nested object
appState.user.subscribe((userObj, key, oldVal, newVal) => {
  console.log(`[User Name Change] User's '${String(key)}' updated to: ${newVal}`);
  document.getElementById('user-name-display').textContent = `User: ${userObj.firstName} ${userObj.lastName}`;
}, 'firstName');

// Trigger changes
appState.isLoggedIn = true; // Triggers global and isLoggedIn callbacks
appState.user.firstName = 'John'; // Triggers global and user's firstName callbacks
appState.user.address.city = 'New City'; // Triggers global callback (due to deep proxying)

appState.products.push('Keyboard'); // Triggers global callback (due to array mutation)

// Unsubscribe from a specific listener
const removeUserLastNameListener = appState.user.subscribe(() => {
  console.log('This listener will be removed.');
}, 'lastName');

appState.user.lastName = 'Smith'; // This listener fires
removeUserLastNameListener(); // Unsubscribe it
appState.user.lastName = 'Jones'; // This listener does NOT fire anymore
```

### 6. Custom lifecycle Events

Custom lifecycle events or methods used by the library.

`"oncreate"` - This custom method will be invoked after element is created, but before it is added to the DOM.
```javascript
span({ // oncreate function is passed to tags properties
	oncreate: (el) => {
		console.log("oncreate", el)
	}
}, "a span")
```

### 7. Sample App

Demonstrate the use of tags, routing, observable and navigation helper for cleanup.

```javascript
import { tags, router, onceNavigate, Observable } from "../seui.js"

const { a, b, p, h1, nav, form, span, textarea, button, input, fragment } = tags

// global state counter
const counter = new Observable(0)

function Home() {
	// or use the local state
	// const counter = new Observable(0)
	const counterSpan = span(counter.value.toString())
	const counterObserver = counter.subscribe(newValue => counterSpan.textContent = newValue.toString())

	// cleanup routine on route change
	onceNavigate((e) => {
		console.log(`cleanup from: ${e.oldURL} to: ${e.newURL}`)
		counter.unsubscribe(counterObserver)
	})

	return fragment( // with fragment you can combine multiple elements without rendering extra div
		h1("Home page"),
		nav(
			a({ href: "#!/" }, "Home"),
			" | ",
			a({ href: "#!/contact" }, "Contact"),
		),
		p("This is a paragraph, ", b("Some Bold Red Text!", { style: { color: "red" } })),
		p("Counter: ", counterSpan),
		button("Increment", {
			onclick: () => counter.update(c => c + 1)
		}),
	)
}

// can be extracted to ./components/ContactForm.js:
const ContactForm = () => form(
	{
		id: "contact-form",
		onsubmit: (e) => {
			e.preventDefault()
			const formData = new FormData(e.target)
			const json = JSON.stringify(Object.fromEntries(formData))
			alert(`TODO: demo send ${json}`)
		}
	},
	input({ id: "name", name: "name", type: "text", placeholder: "Name...", required: "required", oninput: (e) => console.log(e.type, e.target.value) }),
	input({ id: "email", name: "email", type: "email", placeholder: "Email...", required: "required", oninput: (e) => console.log(e.type, e.target.value) }),
	textarea({ id: "message", name: "message", placeholder: "Message...", required: "required", oninput: (e) => console.log(e.type, e.target.value) }),
	input({ type: "submit", value: "Send" })
)

function Contact() {
	return fragment(
		h1("Contact"),
		nav(
			a({ href: "#!/" }, "Home"),
			" | ",
			a({ href: "#!/contact" }, "Contact"),
		),
		p("Lorem ipsum dolor sit amet..."),
		ContactForm(),
	)
}

// initialize the app using router
// this will handle the routing based on the URL hash
// and render the corresponding page
router.init(document.body, "/", {
	"/": Home, // also the default route
	"/contact": Contact,
	// sample error route
	"#!/error/(.+)": (prev, now, $1) => { // custom error route
		console.log(`Error route navigated from ${prev} to ${now} with ${$1}`)
		document.body.replaceChildren(tags.div("Error! You have navigated to the error page."),
		tags.pre(decodeURIComponent($1)))
		return false // stop further processing
	},
	// optional. sample error page
	// "#!/error/(.+)": ErrorPage,
})
```

## Documentation
TODO: improve the documentation.

## Contributing
All contributions are welcome.

## License
SEUI is licensed under the [MIT License](LICENSE).
