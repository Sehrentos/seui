export default function createReactive() {

	// A simple reactivity system using Proxy
	const activeEffect = []; // Stack to hold currently running reactive functions/components

	function track(target, key) {
		if (activeEffect.length > 0) {
			let depsMap = target.__deps__ = target.__deps__ || new Map();
			let dep = depsMap.get(key);
			if (!dep) {
				dep = new Set();
				depsMap.set(key, dep);
			}
			dep.add(activeEffect[activeEffect.length - 1]);
		}
	}

	function trigger(target, key) {
		const depsMap = target.__deps__;
		if (depsMap && depsMap.has(key)) {
			depsMap.get(key).forEach(effect => effect());
		}
	}

	function reactive(obj) {
		return new Proxy(obj, {
			get(target, key, receiver) {
				track(target, key); // Record dependency
				return Reflect.get(target, key, receiver);
			},
			set(target, key, value, receiver) {
				const oldValue = target[key];
				const result = Reflect.set(target, key, value, receiver);
				if (oldValue !== value) {
					trigger(target, key); // Trigger update if value changed
				}
				return result;
			}
		});
	}

	// A simple 'effect' function that re-runs when its dependencies change
	function effect(fn) {
		const reactiveFn = () => {
			activeEffect.push(reactiveFn); // Push this effect to the stack
			fn(); // Run the function, which will read reactive properties and call track()
			activeEffect.pop(); // Pop from stack
		};
		reactiveFn(); // Run initially
		return reactiveFn; // Return for potential cleanup
	}

	return { reactive, effect };
}
