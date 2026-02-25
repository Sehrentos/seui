/**
 * @callback UnsubscribeFunction
 * @returns {void}
 */

/**
 * Callback function invoked when an observable's value changes.
 * @typedef {(newValue: T, oldValue: T, observer: ObserverCallback<T>, thisArg: Observable) => void} ObserverCallback
 * @template T The type of the Observable's value for this specific callback instance.
 */

/**
 * An observable value that can be updated and observed.
 *
 * @template T
 */
export class Observable {
	/**
	 * Create an Observable instance with the given initial value.
	 * @param {T} initValue Initial value of the observable.
	 * @param {ObserverCallback<T>[]} initObservers optional. Initial observers/subscribers of the observable.
	 */
	constructor(initValue, ...initObservers) {
		/**
		 * The current value of the Observable. Can be used to get current value.
		 * Or set new value to the Observable without notifying observers.
		 * @type {T}
		 */
		this.value = initValue;
		/**
		 * The list of observers.
		 * @type {ObserverCallback<T>[]}
		 */
		this.observers = [...initObservers];
	}

	/**
	 * Add an observer to the list of observers.
	 * @param {ObserverCallback<T>} observer The function to be called when the observable's value changes.
	 * @param {boolean} [runAfterSet=false] optional. If true, the observer will be called with the current value as argument.
	 * @returns {UnsubscribeFunction} A function to unsubscribe the observer from the list of observers.
	 */
	subscribe(observer, runAfterSet = false) {
		this.observers.push(observer);
		if (runAfterSet) queueMicrotask(() => observer(this.value, this.value, observer, this));
		return () => this.unsubscribe(observer);
	}

	/**
	 * Remove an observer from the list of observers.
	 * @param {ObserverCallback<T>} observer The function to be removed.
	 * @returns {void}
	 */
	unsubscribe(observer) {
		this.observers = this.observers.filter((obs) => obs !== observer);
	}

	/**
	 * Remove all observers from the list of observers.
	 * @returns {void}
	 */
	unsubscribeAll() {
		this.observers = [];
	}

	/**
	 * Update the value of the Observable.
	 * If the argument is a function, it's called with the current value as argument.
	 * If the argument is not a function, the value is simply updated to the given value.
	 *
	 * @param {((currentValue: T) => T) | T} updater The value or a function to update the value with.
	 * @example
	 * const observable = new Observable(0);
	 * observable.subscribe((value) => console.log(value));
	 * observable.update(1); // logs 1
	 * observable.update((value) => value + 1); // logs 2
	 * @example
	 * const observable = new Observable([1,2,3]);
	 * observable.subscribe((value) => console.log(value));
	 * observable.update((value) => [...value, 4]); // logs [1,2,3,4]
	 * observable.update([5,6,7]); // logs [5,6,7]
	 */
	update(updater) {
		let oldValue = this.value;
		if (typeof updater === 'function') {
			// @ts-ignore function type is checked
			this.value = updater(this.value);
		} else {
			this.value = updater;
		}
		this.observers.forEach((observer) => observer(this.value, oldValue, observer, this));
	}
}

export default Observable
