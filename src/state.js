/**
 * @callback UnsubscribeFunction
 * @returns {void}
 */

/**
 * Callback function invoked when a observed property changes.
 * @template T The type of the object being observed (or its nested part).
 * @param {T} target The proxied object where the change occurred (could be the root or a nested proxied object/array).
 * @param {string | symbol} key The key (property name or array index) that changed.
 * @param {any} oldValue The previous value of the property.
 * @param {any} newValue The new value of the property.
 * @returns {void}
 */

/**
 * @callback ObservableCallback
 * @param {any} target The proxied object where the change occurred (could be the root or a nested proxied object/array).
 * @param {string | symbol} key The key (property name or array index) that changed.
 * @param {any} oldValue The previous value of the property.
 * @param {any} newValue The new value of the property.
 * @returns {void}
 */

/**
 * Method to subscribe to changes on the observed object.
 * @callback SubscribeMethod
 * @param {ObservableCallback} callback The function to call when a change is detected.
 * @param {string | symbol} [specificKey] Optional. If provided, the callback will only fire for changes to this specific property.
 * @returns {UnsubscribeFunction} A function to unsubscribe this specific callback.
 */

/**
 * Method to unsubscribe a callback from changes on the observed object.
 * @callback UnsubscribeMethod
 * @param {ObservableCallback} callback The callback function to remove.
 * @param {string | symbol} [specificKey] Optional. If provided, removes only the callback for this specific property.
 * @returns {void}
 */

/**
 * State as an observable utility
 *
 * This can observe almost any type, except `new Set()`, `new Map()`
 *
 * @template T The type of the target object being observed.
 * @param {T} target Target to observe.
 * @param {boolean} [isAsync=false] Invoke the callbacks as asynchronous or synchronous.
 * @returns {T extends object ? T & {subscribe: SubscribeMethod, unsubscribe: UnsubscribeMethod} : {value: T} & {subscribe: SubscribeMethod, unsubscribe: UnsubscribeMethod}} The proxied target with added subscribe/unsubscribe methods.
 */
export function State(target, isAsync = false) {
	// Stores callbacks for ANY change to the observed object.
	const subscribers = new Set();
	// Stores callbacks for specific property changes (key -> Set of callbacks).
	const propertySubscribers = new Map();

	/**
	 * Notifies all general subscribers and specific property subscribers.
	 * @param {Object} _target The proxied object.
	 * @param {string | symbol} key The key that changed.
	 * @param {*} oldValue The previous value of the property.
	 * @param {*} newValue The new value of the property.
	 */
	const notifySubscribers = (_target, key, oldValue, newValue) => {
		const executeCallback = (callback) => {
			if (isAsync) {
				if (typeof queueMicrotask === "function") {
					queueMicrotask(() => callback(_target, key, oldValue, newValue));
				} else if (typeof Promise === "function") {
					Promise.resolve().then(() => callback(_target, key, oldValue, newValue));
				} else {
					setTimeout(() => callback(_target, key, oldValue, newValue), 0);
				}
			} else {
				callback(_target, key, oldValue, newValue);
			}
		};

		// Notify general subscribers
		subscribers.forEach(executeCallback);

		// Notify specific property subscribers
		if (propertySubscribers.has(key)) {
			propertySubscribers.get(key).forEach(executeCallback);
		}
	};

	const handler = {
		get(currentTarget, key, receiver) {
			if (key === 'isProxy') return true;

			//#region Subscription methods
			if (key === 'subscribe') {
				return (callback, specificKey = null) => {
					if (typeof callback !== 'function') {
						throw Error("Subscribe callback must be a function.");
						// return () => { }; // Return a no-op unsubscribe
					}
					if (specificKey) {
						if (!propertySubscribers.has(specificKey)) {
							propertySubscribers.set(specificKey, new Set());
						}
						propertySubscribers.get(specificKey).add(callback);
						return () => propertySubscribers.get(specificKey).delete(callback);
					}
					subscribers.add(callback);
					return () => subscribers.delete(callback);
				};
			}
			if (key === 'unsubscribe') {
				// Or, just return a function that calls the unsubscribe returned by `subscribe`
				// This method would be less common if subscribe returns an unsubscribe function.
				return (callback, specificKey = null) => {
					if (specificKey) {
						if (propertySubscribers.has(specificKey)) {
							propertySubscribers.get(specificKey).delete(callback);
						}
					} else {
						subscribers.delete(callback);
					}
				};
			}
			//#endregion Subscription methods

			const prop = currentTarget[key];

			// return if property not found (and not a subscription method)
			if (prop === undefined && key !== 'subscribe' && key !== 'unsubscribe') return;
			if (prop === null) return null;

			// set value as proxy if object and not already proxied
			if (typeof prop === 'object' && prop !== null && !prop.isProxy) {
				currentTarget[key] = State(prop, isAsync); // Recursively apply new observer
			}

			return currentTarget[key];
		},
		set(currentTarget, key, newValue, receiver) {
			const oldValue = currentTarget[key];
			const result = Reflect.set(currentTarget, key, newValue, receiver); // Perform the actual set

			// Only notify if the value actually changed (important for primitives)
			if (result && oldValue !== newValue) {
				notifySubscribers(receiver, key, oldValue, newValue);
			}
			return result; // Reflect.set returns true on success, false on failure
		},
		deleteProperty(currentTarget, key) {
			const oldValue = currentTarget[key];
			const result = Reflect.deleteProperty(currentTarget, key);
			if (result) {
				notifySubscribers(currentTarget, key, oldValue, undefined); // Value is now undefined
			}
			return result;
		}
	};

	switch (typeof target) {
		case "undefined":
		case "string":
		case "number":
		case "boolean":
		case "bigint":
		case "symbol": // primitive types
			return new Proxy({ value: target }, handler);

		case "object":
			if (target === null ||
				target instanceof String ||
				target instanceof Boolean ||
				target instanceof Number) {
				// primitive types
				return new Proxy({ value: target }, handler);
			}
			if (target instanceof Set) throw Error(`State cannot observe "Set" type`);
			if (target instanceof Map) throw Error(`State cannot observe "Map" type`); // Also add Map here
			return new Proxy(target, handler);

		default:
			throw Error(`State cannot observe "${typeof target}" type`);
	}
}

export default State
