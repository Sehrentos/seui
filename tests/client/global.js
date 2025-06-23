// @ts-nocheck - seui global sample
const router = seui.router
const fragment = seui.fragment
const { a, p, b, h1, div, form, label, input, dialog } = seui.tags

console.time("#app-start")

function App() {
	return fragment( // create a document fragment, so we can append multiple elements in one go
		div(
			h1("Heading 1"),
			"Hello",
			a({ href: "#!/page2" }, "Go to page view 2"),
			p({ style: { color: "red" } }, "world!!!"),
			p("Paragraph, ", b("BoldText")),
			form(
				label(
					{ for: "input-a" },
					"An input: ",
					input({
						id: "input-a",
						name: "input-a",
						placeholder: "...",
						oninput: (e) => {
							//console.log(e.type, e.target.value)
							document.querySelector("p#input-a-result").textContent =
								e.target.value
						},
					}),
				),
				p({ id: "input-a-result" }),
			),
		),
		dialog(
			{
				open: "open", // attribute [open=open]
				onclick: (e) => {
					// closing the dialog
					if (e.currentTarget.close) e.currentTarget.close()
					e.currentTarget.removeAttribute("open")
				},
			},
			h1("Dialog title"),
			p("Dialog paragraph..."),
		),
	)
}

function Page2() {
	return div(
		h1("Page view 2"),
		a({ href: "#!/" }, "return home")
	)
}

// Render the app to the body
// document.body.append(App())

// Initialize the app with router
// This will handle the routing based on the URL hash
router(document.body, "/", {
	"/": App, // also the default route
	"/page2": () => Page2(),
	"/error": (prev, now) => {
		console.log(`3. Navigated from ${prev} to ${now}`);
		document.body.replaceChildren(div("Error! You have navigated to the error page."));
		return false; // stop further processing
	},
});

console.timeEnd("#app-start")
