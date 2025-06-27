import { tags } from "../seui.js"

const { strong, span } = tags

/**
 * Start a timer that updates the given target element's text content
 * with the timer count every second.
 *
 * The timer is stopped when the target element is disconnected from
 * the DOM.
 *
 * @param {HTMLElement} target - element to update with timer count
 * @param {number} [startCount=0] - count to start the timer from
 * @param {function} [onTick] - function to call when the timer ticks
 */
const createTimer = (target, startCount = 0, onTick) => {
	let timer, count = +startCount
	try {
		timer = setInterval(() => {
			count++
			if (typeof onTick === "function") {
				onTick({ target, timer, count })
			}
			if (target == null || target.isConnected === false) {
				// timer stopped (target disconnected)
				clearInterval(timer)
				return
			}
			// update DOM
			target.textContent = `${count}s`
		}, 1000)
	} catch (e) {
		console.error("SampleTimer::startTimer", e)
		clearInterval(timer)
	}
}

/**
 * SampleTimer component that starts a timer that updates the given target
 * element's text content with the timer count every second.
 *
 * The timer is stopped when the target element is disconnected from the
 * DOM.
 *
 * @param {Object} [props] - component properties
 * @param {string} [props.id="ui-timer"] - id of the timer element
 * @param {function} [props.onTick] - function to call when the timer ticks
 */
export default function SampleTimer(props = {}) {
	return strong("Timer: ", {
		id: props.id || "ui-timer",
		...props
	},
		span({
			oncreate: (el) => {
				createTimer(el, 0, props.onTick)
			}
		})
	)
}
