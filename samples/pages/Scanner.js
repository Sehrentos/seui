import { tags, signal, computed } from "seui";
import Navigation from "../components/Navigation.js"
// @ts-ignore see https://github.com/zxing-js/library/
import { MultiFormatReader, BrowserMultiFormatReader, BarcodeFormat, DecodeHintType, NotFoundException, ChecksumException, FormatException } from "https://cdn.jsdelivr.net/npm/@zxing/library@0.23.0/+esm";

const { a, p, h1, ol, li, div, pre, video, button, fieldset, label, select, option, fragment } = tags;

/**
 * @typedef {Object} ZXingResult
 * @property {number} format - The format of the decoded barcode (e.g. 11 = QR_CODE).
 * @property {number} numBits - The number of bits in the raw bytes of the barcode.
 * @property {Uint8Array} rawBytes - The raw bytes of the decoded barcode.
 * @property {Object|null} resultMetadata - Additional metadata about the decoded barcode, if available.
 * @property {Array} resultPoints - An array of points representing the position of the barcode in the image.
 * @property {string} text - The decoded text from the barcode.
 * @property {number} timestamp - The timestamp when the barcode was decoded.
 */

const hints = new Map();
const formats = [
	BarcodeFormat.QR_CODE,
	BarcodeFormat.DATA_MATRIX,
	/*, ...*/
];
hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

// Note: MultiFormatReader.prototype.decodeInternal has console.warn for debug, comment it out
// hack: disable console.warn spam from the library...
// remove this when it stops working or have some issues with decoding
// if you use continuous detection from video feed,
// it will spam thousands of times in the console
MultiFormatReader.prototype.decodeInternal = function (t) {
	if (this.readers === null)
		throw new Error('No readers where selected, nothing can be read.');
	for (const e of this.readers)
		try {
			return e.decode(t, this.hints);
		} catch (_t) {
			continue;
		}
};
const codeReader = new BrowserMultiFormatReader();

let selectedDeviceId;

const counter = signal(0)
const timestamp = signal(Date.now())
/**	@type {import("seui").Signal<string[]>} */
const barcodes = signal([])

export default function Scanner() {
	// map barcodes into elements instead of Array.toString
	const barcodeElements = computed(() => barcodes.value.map((text) => li(text)))

	return fragment(
		h1("Scanner"),
		Navigation(
			a({ href: "#!/" }, "Home"),
			a("Scanner"),
		),
		p('State.counter: ', counter),
		p('State.timestamp: ', timestamp),
		/*p('State.barcodes: ', barcodes),*/
		div(
			video({ id: 'video', width: 300, height: 200, style: 'border: 1px solid gray' })
		),
		fieldset(
			{ style: 'margin-top: 10px' },
			label({ htmlFor: 'decoding-style' }, 'Decoding Style: '),
			select({ id: 'decoding-style' },
				option({ value: 'continuous' }, 'Continuous'),
				option({ value: 'once' }, 'Once')
			)
		),
		fieldset(
			{ style: 'margin-top: 10px' },
			label({ htmlFor: 'sourceSelect' }, 'Camera Source: '),
			select({ id: 'sourceSelect', onmount: onInit, onunmount: onReset })
		),
		fieldset(
			{ style: 'margin-top: 10px' },
			label({ htmlFor: 'result' }, 'Result: '),
			pre({ id: 'result', style: 'border: 1px solid gray; padding: 5px;' })
		),
		fieldset(
			{ style: 'margin-top: 10px' },
			label({ htmlFor: 'result' }, 'Decoded Barcodes: '),
			ol({ id: 'result' }, barcodeElements),
		),
		div(
			{ style: 'margin-top: 10px' },
			button({ onclick: onStart }, 'Start scanning'),
			button({ onclick: onReset, style: 'margin-left: 10px;' }, 'Stop scanning'),
			button({ onclick: () => window.history.back(), style: 'margin-left: 10px;' }, 'Back'),
		)
	)
}

async function onInit() {
	try {
		console.log('ZXing code reader initialized')
		/** @type {HTMLSelectElement} */
		//@ts-ignore
		const sourceSelect = document.getElementById('sourceSelect')
		if (!sourceSelect) {
			console.error('No source select element found')
			return;
		}
		const videoInputDevices = await codeReader.listVideoInputDevices();
		selectedDeviceId = videoInputDevices[0].deviceId
		if (videoInputDevices.length >= 1) {
			videoInputDevices.forEach((element) => {
				// console.log(`Found video input device: ${element.label} (${element.deviceId})`, element)
				const sourceOption = document.createElement('option')
				sourceOption.text = element.label
				sourceOption.value = element.deviceId // can be undefined
				sourceSelect.appendChild(sourceOption)
			})
			sourceSelect.onchange = () => {
				selectedDeviceId = sourceSelect.value;
			};
		}
	} catch (/** @type {*} */err) {
		console.error('onInit Error:', err)
	}
}

function onStart() {
	/** @type {string|undefined} */
	//@ts-ignore
	const decodingStyle = document.getElementById('decoding-style')?.value;
	if (decodingStyle == "once") {
		decodeOnce();
	} else {
		decodeContinuously();
	}
	console.log(`Started decode from camera with id ${selectedDeviceId}`)
}

function onReset() {
	console.log('Reset.')
	codeReader.reset()
	const result = document.getElementById('result')
	if (!result) return;
	result.textContent = '';
}

/**
 * Adds a barcode to the state.
 * @param {ZXingResult} result
 */
function addBarcode(result) {
	console.log('update state', result.format, result.text);
	if (!barcodes.value.includes(result.text)) { // optional. keep list item unique
		counter.value++;
		timestamp.value = Date.now();
		barcodes.value = [...barcodes.value, result.text]
	}
}

function decodeOnce() {
	codeReader.decodeFromInputVideoDevice(selectedDeviceId, 'video').then((/** @type {ZXingResult} */result) => {
		console.log(result)
		addBarcode(result)
		//@ts-ignore
		document.getElementById('result').textContent = result.text
	}).catch((/** @type {*} */err) => {
		console.error(err)
		//@ts-ignore
		document.getElementById('result').textContent = err
	})
}

function decodeContinuously() {
	codeReader.decodeFromInputVideoDeviceContinuously(selectedDeviceId, 'video', (/** @type {ZXingResult|null} */result, err) => {
		if (result) {
			// properly decoded qr code
			console.log('Found QR code!', result)
			addBarcode(result)
			//@ts-ignore
			document.getElementById('result').textContent = result.text
			return
		}
		if (err) {
			// As long as this error belongs into one of the following categories
			// the code reader is going to continue as excepted. Any other error
			// will stop the decoding loop.
			//
			// Excepted Exceptions:
			//
			//  - NotFoundException
			//  - ChecksumException
			//  - FormatException
			if (err instanceof NotFoundException) {
				// console.log('No QR code found.')
				return
			}
			if (err instanceof ChecksumException) {
				console.log('A code was found, but it\'s read value was not valid.')
				return
			}

			if (err instanceof FormatException) {
				console.log('A code was found, but it was in a invalid format.')
			}
		}
	})
}
