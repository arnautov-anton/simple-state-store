import { useState, useEffect } from "react";

import { type SimpleStateStore } from "../../core";

export const useStateStore = <G, L extends unknown[]>(
	store: ReturnType<SimpleStateStore<G>>,
	selector: (v: G) => L
) => {
	const [state, setState] = useState<L>(selector(store.getLatestValue()));

	useEffect(() => {
		const unsubscribe = store.subscribe((newValue) => {
			const selectedValues = selector(newValue);

			setState((pv) => {
				const hasUnequalMembers = pv.some(
					(value, index) => selectedValues[index] !== value
				);

				return hasUnequalMembers ? selectedValues : pv;
			});
		});

		return unsubscribe;
	}, [store, selector]);

	return state;
};
