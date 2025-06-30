import { tags } from "../../seui.js"
import Navigation from "../components/Navigation.js"

const { a, p, h1, div, form, textarea, fieldset, legend, label, input } = tags

const Input = (labelText, props = {}) => {
	const inputProps = { id: "input-a", name: "input-a", type: "text", placeholder: "...", ...props }
	return fieldset(
		legend(
			label({ for: inputProps.id }, labelText),
		),
		input(inputProps),
	)
}

const TextArea = (labelText, props = {}) => {
	const inputProps = { id: "input-a", name: "input-a", placeholder: "...", ...props }
	return fieldset(
		legend(
			label({ for: inputProps.id }, labelText),
		),
		textarea(inputProps),
	)
}

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
	Input("Name", { id: "name", name: "name", type: "text", required: "required", oninput: (e) => console.log(e.type, e.target.value) }),
	Input("Email", { id: "email", name: "email", type: "email", required: "required", oninput: (e) => console.log(e.type, e.target.value) }),
	TextArea("Message", { id: "message", name: "message", required: "required", oninput: (e) => console.log(e.type, e.target.value) }),
	input({ type: "submit", value: "Send" }),
)

export default function Contact() {
	return div(
		h1("Contact"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a({ href: "#!/contact" }, "Contact"),
		),
		p("Lorem ipsum dolor sit amet..."),
		ContactForm(),
	)
}
