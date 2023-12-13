import "./App.css";

import { SimpleStateStore } from "simple-state-store";
import { useStateStore } from "simple-state-store/react";
import { produce } from "immer";
import { PropsWithChildren, useEffect } from "react";

type StoreType = {
	pushToArrayOfData: (input: string) => void;
	prependArrayOfData: (input: string) => void;
	arrayOfData: string[];
};

const store = new SimpleStateStore<StoreType>((get, set) => ({
	pushToArrayOfData: (input: string) => {
		const newDataArray = [...get().arrayOfData];
		newDataArray.push(input);

		set((cv) => ({
			...cv,
			arrayOfData: newDataArray,
		}));
	},
	prependArrayOfData: (input: string) => {
		set(
			produce((draft) => {
				draft.arrayOfData.unshift(input);
			})
		);
	},
	arrayOfData: ["abc"],
}));

const selector1 = (currentValue: StoreType) => [currentValue.pushToArrayOfData];
const Sub1 = () => {
	const [action] = useStateStore(store, selector1);

	console.log("re-rendering", action);

	return null;
};

const selector2 = (currentValue: StoreType) =>
	[
		currentValue.arrayOfData,
		currentValue.pushToArrayOfData,
		currentValue.prependArrayOfData,
	] as const;
const Sub2 = () => {
	const [data, append, prepend] = useStateStore(store, selector2);
	return (
		<>
			<button onClick={(e) => append("a" + e.timeStamp.toString())}>
				append timestamp
			</button>
			<button onClick={(e) => prepend("p" + e.timeStamp.toString())}>
				prepend value
			</button>
			<div>{JSON.stringify(data)}</div>
		</>
	);
};

const Sub3WChildren = ({ children }: PropsWithChildren) => {
	const [data] = useStateStore(store, selector2);

	useEffect(() => {
		console.log(data);
	}, [data]);

	return <>{children}</>;
};

function App() {
	return (
		<>
			<h1>Simple State Store Example</h1>
			<Sub2 />
			<Sub3WChildren>
				<Sub1 />
			</Sub3WChildren>
		</>
	);
}

export default App;
