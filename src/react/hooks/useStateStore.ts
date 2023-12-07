import { useState, useEffect } from "react";

import type { SimpleStateStore } from "../../core";

export const useStateStore = <G, L extends unknown[]>(
	store: SimpleStateStore<G>,
	selector: (v: G) => L
) => {
	const [state, setState] = useState<L>(selector(store.getLatestValue()));

	useEffect(() => {
		const unsubscribe = store.subscribe((newValue) => {
			const selectedValues = selector(newValue);

			setState((currentValue) => {
				// check for unequal members
				// do not trigger "re-render" unless members changed
				const hasUnequalMembers = currentValue.some(
					(value, index) => selectedValues[index] !== value
				);

				// return currentValue to bail out of re-render trigger
				return hasUnequalMembers ? selectedValues : currentValue;
			});
		});

		return unsubscribe;
	}, [store, selector]);

	return state;
};
