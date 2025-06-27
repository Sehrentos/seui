// state-manager.js
// Central State Manager with Event Dispatching
const stateDispatcher = new EventTarget(); // A dedicated event target for state changes

const appState = {
	_counter: 0,
	_userName: 'Guest',

	get counter() {
		return this._counter;
	},
	set counter(value) {
		if (this._counter !== value) {
			const oldValue = this._counter;
			this._counter = value;
			// Dispatch a custom event when counter changes
			stateDispatcher.dispatchEvent(new CustomEvent('counterChanged', {
				detail: { newValue: value, oldValue: oldValue }
			}));
		}
	},

	get userName() {
		return this._userName;
	},
	set userName(value) {
		if (this._userName !== value) {
			const oldValue = this._userName;
			this._userName = value;
			// Dispatch a custom event when userName changes
			stateDispatcher.dispatchEvent(new CustomEvent('userNameChanged', {
				detail: { newValue: value, oldValue: oldValue }
			}));
		}
	},

	// Or a generic update method for multiple properties
	updateState(updates) {
		for (const key in updates) {
			if (appState.hasOwnProperty(`_${key}`)) { // Ensure it's a managed property
				const oldValue = appState[`_${key}`];
				const newValue = updates[key];
				if (oldValue !== newValue) {
					appState[`_${key}`] = newValue;
					stateDispatcher.dispatchEvent(new CustomEvent(`${key}Changed`, {
						detail: { newValue: newValue, oldValue: oldValue }
					}));
				}
			}
		}
	}
};

export { appState, stateDispatcher };
