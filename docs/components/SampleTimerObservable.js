import { tags, Observable } from "../../seui.js"

const { div } = tags

/**
 * Sample timer observable with div element
 * @param {Object} props
 * @param {number} [props.count=0]
 * @param {number} [props.stopAfter]
 * @returns {Observable<HTMLDivElement>}
 */
export default function SampleTimerObservable(props = {}) {
	let count = props.count || 0;

	// Observable element
	const divObservable = new Observable(
		div(`observer timer ${count}`), // with initial value
		(newValue) => console.log("observer timer value has changed:", newValue)
	);

	// update the observable element
	let interval = setInterval(() => {
		if (props.stopAfter && count >= (props.stopAfter - 1)) clearInterval(interval);
		// update the observable value/values
		divObservable.update((newValue) => {
			newValue.textContent = `observer timer ${++count}`
			return newValue
		})
	}, 1000);

	// to update the observable value without triggering the callback value as setter:
	// testObservable.value.textContent = `observer timer ${count} (no update)`

	//@ts-ignore
	return divObservable
}
