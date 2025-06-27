# SEUI: Simple JavaScript UI Components

SEUI is a JavaScript UI library focused on creating simple components.

---

> [!WARNING]
> This is a **demo only**. Expect bugs and unfinished functionality.

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
		- [Building](#building)
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
 - See sample client code in the [tests/client/index.js](tests/client/index.js) directory.
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

### Building
Here are some commands to re-build the project when you modify the source code.

> [!NOTE]
> Some commands require global terser module to be installed (this is an optional step to minify the source code).

Combine `npm run build-global && npm run minify && npm run minify-global` with single command:
(this will build `seui-global.js` and minify it and the `seui.min.js` file.)

```bash
npm run build
```

## Contributing
All contributions are welcome.

## License
SEUI is licensed under the [MIT License](LICENSE).
