const http = require('http')
const path = require('path')
const { access, constants, readFile } = require('fs/promises')

const HOST = "127.0.0.1"
const PORT = 3000
const WWW_ROOT = path.join(__dirname, '../client')

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url, `http://${req.headers.host}`)

		// optional. Blank icon
		if (url.pathname === '/favicon.ico') {
			res.writeHead(200, {
				// set very long cache
				'Cache-Control': 'max-age=31536000',
				'Content-Type': 'image/x-icon'
			})
			res.end()
			return
		}

		// optional. Chrome DevTools
		if (url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
			res.writeHead(404)
			res.end()
			return
		}

		// serve the ESM library for testing
		if (url.pathname === '/seui.js') {
			const data = await readFile(path.join(__dirname, '../../', url.pathname))
			res.writeHead(200, {
				'Content-Type': 'application/javascript',
				'content-length': data.length
			})
			res.end(data)
			return
		}

		// serve the global library for testing
		if (url.pathname === '/seui-global.js') {
			const data = await readFile(path.join(__dirname, '../../', url.pathname))
			res.writeHead(200, {
				'Content-Type': 'application/javascript',
				'content-length': data.length
			})
			res.end(data)
			return
		}

		// serve any files in the public directory
		const filepath = path.join(WWW_ROOT, url.pathname === '/' ? '/index.html' : url.pathname)
		try {
			// check if file exists and then send it
			await access(filepath, constants.F_OK) // throws if fails
			// send file using fs/promises
			const data = await readFile(filepath)
			res.writeHead(200, {
				'Content-Type': getMimeType(filepath),
				'content-length': data.length
			})
			res.end(data)

		} catch (ex) {
			res.writeHead(404)
			res.end(`The file "${url.pathname}" does not exist. CODE ${ex.code}`, 'utf-8')
		}
	}
	catch (e) {
		res.writeHead(500)
		res.end('Sorry, something went wrong. CODE' + e.code, 'utf-8')
	}
})

server.listen(PORT, HOST, (e) => {
	if (e) return console.log(`Failed to start HTTP server at port ${PORT}!`)
	console.log(`HTTP server is now live on http://${HOST}:${PORT}/`)
})

/**
 * Get MIME type by extension name
 *
 * @param {*} fileName
 * @returns {String} Mime string
 */
function getMimeType(fileName) {
	var mime, extname = path.extname(fileName);
	switch (extname) {
		case '.htm':
		case '.html':
			mime = 'text/html';
			break;
		case '.css':
			mime = 'text/css';
			break;
		case '.xhtml':
			mime = 'application/xhtml+xml';
			break;
		case '.xml':
			mime = 'application/xml';
			break;
		case '.js':
		case '.jsm':
			mime = 'application/javascript';
			break;
		case '.ts':
			mime = 'application/typescript';
			break;
		case '.json':
			mime = 'application/json';
			break;
		case '.pdf':
			mime = 'application/pdf';
			break;
		case '.png':
			mime = 'image/png';
			break;
		case '.gif':
			mime = 'image/gif';
			break;
		case '.jpg':
		case '.jpeg':
			mime = 'image/jpeg';
			break;
		case '.ico':
			mime = 'image/x-icon';
			break;
		case '.svg':
			mime = 'image/svg+xml';
			break;
		case '.wav':
			mime = 'audio/x-wav';
			break;
		case '.oga':
			mime = 'audio/ogg';
			break;
		case '.mid':
		case '.midi':
			mime = 'audio/midi';
			break;
		case '.mpeg':
			mime = 'video/mpeg';
			break;
		case '.ogv':
			mime = 'video/ogg';
			break;
		case '.otf':
			mime = 'font/otf';
			break;
		case '.ttf':
			mime = 'font/ttf';
			break;
		case '.woff':
			mime = 'font/woff';
			break;
		case '.woff2':
			mime = 'font/woff2';
			break;
		case '.zip':
			mime = 'application/zip';
			break;
		case '.7z':
			mime = 'application/x-7z-compressed';
			break;
		default:
			mime = 'text/plain';
			break;
	}
	return mime;
}
