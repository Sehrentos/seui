/**
 * Callback function invoked when an observable's value changes.
 * @typedef {(newValue: T, oldValue: T) => void} ObserverCallback
 * @template T The type of the Observable's value for this specific callback instance.
 */

/**
 * An observable value that can be updated and observed.
 * @template T The type of the value held by the Observable.
 */
export default class Observable {
	/**
	 * Create an Observable instance with the given initial value.
	 * @param {T} value Initial value of the observable.
	 */
	constructor(value) {
		/** @type {T} */
		this._value = value;
		/** @type {Array<ObserverCallback<T>>} */
		this.observers = [];
	}

	/**
	 * Add an observer to the list of observers.
	 * @param {ObserverCallback<T>} observer The function to be called when the observable's value changes.
	 * @returns {ObserverCallback<T>} The observer function that was added.
	 */
	subscribe(observer) {
		this.observers.push(observer);
		return observer;
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
	 * Update the value of the Observable.
	 * If the argument is a function, it's called with the current value as argument.
	 * If the argument is not a function, the value is simply updated to the given value.
	 * Any registered observers are called with the new and old value after the update.
	 * @param {((value: T) => T) | T} [updater] The value or a function to update the value with.
	 */
	update(updater) {
		let oldValue = this._value;
		if (typeof updater === 'function') {
			// @ts-ignore function type is checked
			this._value = updater(this._value);
		} else {
			this._value = updater;
		}
		this.observers.forEach((observer) => observer(this._value, oldValue));
	}

	/**
	 * The current value of the Observable.
	 * @type {T}
	 */
	get value() {
		return this._value;
	}

	/**
	 * Sets the value of the Observable.
	 * Any registered observers are called with the new and old value after the update.
	 * @param {T} value The new value to set.
	 * @returns {void}
	 */
	set value(value) {
		this._value = value;
		this.update();
	}
}
