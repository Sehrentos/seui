# SEUI: Simple JavaScript UI Components

SEUI is a JavaScript UI library focused on creating simple components.

See demo page [here](https://sehrentos.github.io/seui/).

---

> [!WARNING]
> This is a **demo only**. Expect bugs and unfinished functionality.

Quick example:
```javascript
import { tags, fragment, router } from "./seui.js"
const { a, b, p, h1, div, nav, form, textarea, input } = tags

function Home() {
	return fragment( // with fragment you can combine multiple elements without rendering extra div
		h1("Home page"),
		nav(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/contact" }, "Contact"),
		),
		p("This is a paragraph, ", b("Some Bold Red Text!", { style: { color: "red" } }))
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
	return div(
		h1("Contact"),
		nav(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/contact" }, "Contact"),
		),
		p("Lorem ipsum dolor sit amet..."),
		ContactForm(),
	)
}

// initialize the app using router
// this will handle the routing based on the URL hash
// and render the corresponding page
router(document.body, "/", {
	"/": Home, // also the default route
	"/contact": Contact,
	// sample error route
	"#!/error/(.+)": (prev, now) => { // custom error route
		console.log(`Error route navigated from ${prev} to ${now}`)
		// take the error message and decode uri component
		const matches = now.match(/#!\/error\/(.+)/)
		const message = matches == null ? "" : decodeURIComponent(matches[1])
		document.body.replaceChildren(tags.div("Error! You have navigated to the error page."), tags.pre(message))
		return false // stop further processing
	},
	// optional. sample error page
	// "#!/error/(.+)": ErrorPage,
})
```

## Table of Contents
-----------------

- [SEUI: Simple JavaScript UI Components](#seui-simple-javascript-ui-components)
	- [Table of Contents](#table-of-contents)
	- [Installation](#installation)
		- [Terser for optional JS minification](#terser-for-optional-js-minification)
	- [Usage](#usage)
	- [Features](#features)
	- [Documentation](#documentation)
		- [Events](#events)
		- [Samples](#samples)
	- [Contributing](#contributing)
	- [License](#license)

## Installation
---------------
TODO: make into npm module and provide installation steps.

### Terser for optional JS minification
This is optional, but this way you can minify JS files.
```bash
npm install terser -g
```
Then use the npm command:
```bash
npm run minify
```
Or [Terser CLI](https://www.npmjs.com/package/terser#command-line-usage) to minify specific JS file with command:
```bash
terser seui.js -o seui.min.js --compress --mangle
```

## Usage
To use SEUI in your project, import the library and start using its components:

```javascript
import { tags } from './seui.js'
const { div, button } = tags

const App = () => {
  return div(
      button("Click me!")
  )
}
```

## Features
These are the main features this library provides:
 - tags - create HTML elements
 - ns - create namespace elements
 - fragment - create fragment element
 - router - create router

## Documentation
TODO: improve the documentation.

### Events
Here is a list of custom events or callback used by the library:
 - `"oncreate"` - This custom callback will be invoked after element is created, but before it is added to the DOM.
	```javascript
	// example to demonstrate oncreate function
	span({
		oncreate: (el) => {
			console.log("oncreate", el)
		}
	}, "a span")
	```

### Samples
 - See sample client code in the [docs/index.js](docs/index.js) directory.
 - There is also a local test server [tests/server/server.js](tests/server/server.js) run it with command:
	```bash
	npm run test
	```
	Then open the browser (Windows)
	```bash
	explorer "http://127.0.0.1:3000"
	```
	and for other
	```bash
	open "http://127.0.0.1:3000"
	```

## Contributing
All contributions are welcome.

## License
SEUI is licensed under the [MIT License](LICENSE).
