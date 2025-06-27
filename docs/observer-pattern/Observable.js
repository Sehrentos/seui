/**
 * Create and Observable class
 */
export default class Observable {
	/**
	 * Create an Observable instance with the given initial value.
	 * @param {*} value Initial value of the observable.
	 */
	constructor(value) {
		this._value = value;
		this.observers = [];
	}

	/**
	 * Add an observer to the list of observers.
	 * @param {(newValue: any, oldValue: any)=>void} observer The function to be called when the observable's value changes.
	 */
	subscribe(observer) {
		this.observers.push(observer);
	}

	/**
	 * Remove an observer from the list of observers.
	 * @param {Function} observer The function to be removed.
	 */
	unsubscribe(observer) {
		this.observers = this.observers.filter((obs) => obs !== observer);
	}

	/**
	 * Update the value of the Observable.
	 * If the argument is a function, it's called with the current value as argument.
	 * If the argument is not a function, the value is simply updated to the given value.
	 * Any registered observers are called with the new and old value after the update.
	 * @param {((value: any) => any) | any} [updater] The value or a function to update the value with.
	 */
	update(updater) {
		let oldValue = this._value;
		this._value = typeof updater === 'function' ? updater(this._value) : updater;
		this.observers.forEach((observer) => observer(this._value, oldValue));
	}

	/**
	 * The current value of the Observable.
	 * @type {*}
	 */
	get value() {
		return this._value;
	}

	/**
	 * Sets the value of the Observable.
	 * Any registered observers are called with the new and old value after the update.
	 * @type {*}
	 */
	set value(value) {
		this._value = value;
		this.update();
	}
}
