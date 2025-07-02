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
  - [Plans](#plans)
  - [Contributing](#contributing)
  - [License](#license)

## Key Features
- Declarative HTML with Tags:
  - Create DOM elements directly in JavaScript using a simple functional API, making your UI structure explicit and composable.
  - Supports standard HTML tags and also provides namespaces for creating SVG and MathML elements.
- Powerful Client-Side Router:
  - A single-instance hash-based router for managing application views.
  - Supports both exact string matches (e.g., `/path`) and flexible regular expression patterns (e.g., `#!/users/(\d+)`).
  - Integrates with component lifecycle for automatic cleanup when routes change.
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
      style: 'backgroundColor:lightblue',
    })
  )
}

document.body.appendChild(App())
```

### 2. Namespaced Tags (e.g., SVG)

Create SVG elements with proper namespaces.

```javascript
import { ns } from "./seui.js"

const { svg, path } = ns("http://www.w3.org/2000/svg")

/**
 * svg world icon
 */
export default function SVGWorld() {
  return svg(
    {
      class: "anim-spin",
      "aria-hidden": "true",
      viewbox: "0 0 24 24",
      width: "24px",
      height: "24px",
    },
    path({ d: "M0 0h24v24H0z", fill: "none" }),
    path({ d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z", fill: "#2962ff" }),
  )
}
```

### 3. Client-Side Routing with router

Set up routes and navigate through your single-page application.

```javascript
import { tags, router } from './seui.js';

const { a, p, h1, div, nav, button } = tags;

const appRoot = document.getElementById('app-root'); // Your main application container

// Dummy page components (in a real app, these would be more complex)
const Navigation = () => nav(a({ href: "#!/" }, "Home"), a({ href: "#!/about" }, "About"));
const HomePage = () => div(
  Navigation(),
  h1('Welcome Home!'),
  p('This is the homepage.'),
  button({ onclick: () => router.go('#!/about') }, 'Go to About')
);
const AboutPage = () => div(
  Navigation(),
  h1('About Us'),
  p('Learn more about seui.'),
  button({ onclick: () => router.go('#!/user/123') }, 'Show profile: 123')
);
const UserProfilePage = (userId) => div(h1(`User Profile for ID: ${userId}`));

router.init(appRoot, "/", {
  // Simple string routes
  "/": HomePage,
  "/about": () => AboutPage(),
  // RegExp route with possible match groups
  "#!/user/(\\d+)": (oldURL, newURL, userId) => {
    return UserProfilePage(userId || 'Unknown');
  },
  // Error route fallback
  "#!/error/(.+)": (oldURL, newURL, message) => {
    return div(h1('Error!'), p(`Page not found or error: ${decodeURIComponent(message)}`));
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
  // its possible to update without notifying observers,
  // by using the setter value
  //statusMessage.value = 'Processing...';
  statusMessage.update('Processing...');
}, 1000);

setTimeout(() => {
  statusMessage.update('Done!');
  counter.update(10);
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
  console.log(`[Global Change] Property '${key}' changed.`, obj);
});

// Subscribe to a specific property of the top-level object
appState.subscribe((obj, key, oldVal, newVal) => {
  console.log(`[Login Status] User login state: ${newVal ? 'Logged In' : 'Logged Out'}`);
}, 'isLoggedIn');

// Subscribe to a specific property of a nested object
appState.user.subscribe((userObj, key, oldVal, newVal) => {
  console.log(`[User Name Change] User's '${key}' updated to: ${newVal}`);
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

`"oncreate"` - This event will be invoked after element is created, but before it is added to the DOM.

```javascript
fragment({ // function is passed to tags properties
  oncreate: (e) => console.log("component created")
}, "Here is dummy page")
```

> [!NOTE]
> Events below are bound to the use of the `Router` class, since it will monitor the route changes.
> These will not trigger when router is not in use.

`"onmount"` - This event will be invoked after element is added to the DOM.

```javascript
fragment({ // function is passed to tags properties
  onmount: (e) => console.log("component mounted")
}, "Here is dummy page")
```

`"onunmount"` - This event will be invoked when element is removed from the DOM.

```javascript
fragment({ // function is passed to tags properties
  onunmount: (e) => console.log("component unmounted")
}, "Here is dummy page")
```

### 7. Sample App

Demonstrate the use of tags, routing, observable state and unmount lifecycle event for unbind/unsubscribe.

```javascript
import { tags, router, Observable } from "./seui.js"

const { a, b, p, h1, nav, form, span, textarea, button, input, fragment } = tags

// global state counter
const counter = new Observable(0)

function Home() {
  // or use the local state
  // const counter = new Observable(0)
  const counterSpan = span(counter.value.toString())
  const counterObserver = counter.subscribe(newValue => counterSpan.textContent = newValue.toString())

  return fragment( // with fragment you can combine multiple elements without rendering extra div
    {
      onunmount: (e) => {
        console.log("Unmounted. Remove listeners")
        counter.unsubscribe(counterObserver)
      }
    },
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
  input({ id: "name", name: "name", type: "text", placeholder: "Name...", required: "required" }),
  input({ id: "email", name: "email", type: "email", placeholder: "Email...", required: "required" }),
  textarea({ id: "message", name: "message", placeholder: "Message...", required: "required" }),
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
  "#!/error/(.+)": (oldURL, newURL, message) => {
    console.log(`RouteError from ${oldURL} to ${newURL} with ${message}`)
    return fragment(
      tags.div("Error! You have navigated to the error page."),
      tags.pre(decodeURIComponent(message))
    )
  },
  // optional. sample error page
  // "#!/error/(.+)": ErrorPage,
})
```

## Documentation
TODO: improve the documentation.

## Plans
1. Improve the Router
2. Improve the lifecycles
3. Improve the docs and samples
4. Other improvements overall

## Contributing
All contributions are welcome.

## License
SEUI is licensed under the [MIT License](LICENSE).
