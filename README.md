# SEUI Library

SEUI is javascript UI library for creating simple components.

## Table of Contents
-----------------

- [SEUI Library](#seui-library)
	- [Table of Contents](#table-of-contents)
	- [Installation](#installation)
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
 - There is also an test server [tests/server/server.js](tests/server/server.js) file. To use it run npm command:
	```bash
	npm run start
	```

## Contributing
All contributions are welcome.

## License
SEUI is licensed under the [MIT License](LICENSE).
