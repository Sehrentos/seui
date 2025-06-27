// helper to convert ES6 to ES5 global file for browser
// it will read the seui.js file and override all exports to window.seui
// and also wrapping it in IIFE to avoid polluting global scope
// Note:
// this will only work on simple files and specific use cases, like the export replacer below.
// When the seui.js file gets more complex, this will need to be updated.
import fs from "fs"
import path from "path"

const readFile = path.join(process.cwd(), "seui.js")
const writeFile = path.join(process.cwd(), "docs", "seui-global.js")
const data = fs.readFileSync(readFile, "utf-8")

// find and replace:
// export { tags, fragment, ns, merge, router, update, remove }
const code = data.replace(/export\s+{([^}]+)}/g, "root.seui = { $1 }\n")

// write into IIFE
fs.writeFileSync(writeFile, `(function(root){\n"use strict";\n${code}})(this||window);`)
console.log(`seui.js built to ${writeFile}`)

// also copy the seui.js file into /docs for github pages
fs.copyFileSync(readFile, path.join(process.cwd(), "docs", "seui.js"))
