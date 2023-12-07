# Simple State Store

Very simple state management tool which combines power of RxJS BehaviorSubject and selectors.

## How to use it

### Vanilla

```tsx
import { SimpleStateStore } from "simple-state-store";

const initialState = {
	user: {
		name: "John",
		age: 30,
		hobbies: ["biking", "fishing"],
	},
};

const store = new SimpleStateStore(initialState);

const unsubscribe = store.subscribe(console.log); // logs initial state on subscription

store.next({
	user: {
		name: "Mark",
		age: 31,
		hobbies: ["swimming", "hiking"],
	},
});

// or with patch function

store.next((currentValue) => ({
	...currentValue,
	user: { ...currentValue.user, age: 32 },
}));
```

### Combine state updates with Immer

```tsx
import { produce } from "immer";

store.next(
	produce((draft) => {
		draft.user.age = 33;
	})
);
```

### Use with React & selectors

In the example bellow you can see that `age` and `hobbies` have been extracted from the "global" state as these two values are being rendered within one component. While it's fine to do so in this example the problem would appear if this component relied on some heavy render-time calculation which was based on `hobbies` value. Each time you'd change `age` - `useStateStore` would re-run your selector and through comparison would realize that `age` has changed, triggering the component re-render unnecessarily slowing down your application by re-running action that was unnecessary to re-run in the first place.

```tsx
import { useStateStore } from "simple-state-store/react";

const Component = () => {
	const [age, hobbies] = useStateStore(store, (nextValue) => [
		nextValue.user.age,
		nextValue.user.hobbies,
	]);

	return (
		<div>
			<span>{age}</span>
			<span>{hobbies.join(",")}</span>
		</div>
	);
};
```

To mitigate this issue you'd break your component down into multiple smaller ones, making it more granular and moving related state to components, that directly rely on it:

```tsx
import { useStateStore } from "simple-state-store/react";

const AgeRenderer = () => {
	const [age] = useStateStore(store, (nextValue) => [nextValue.user.age]);

	return <span>{age}</span>;
};

const HobbiesRenderer = () => {
	const [hobbies] = useStateStore(store, (nextValue) => [nextValue.user.age]);

	// imagine some heavy calculation here

	return <span>{hobbies.join(",")}</span>;
};

const Component = () => (
	<div>
		<AgeRenderer />
		<HobbiesRenderer />
	</div>
);
```

Now - even though both of the components rely on a globally defined state - they will re-render only if their selected sub-state has actually changed. So changing property `age` won't affect `HobbiesRenderer` at all.

Now again - sub-state grouping is not a bad practice - not at all. If it makes more sense architecturally to render reactive values within one component markup - then by all means, do it. This optimization is mostly beneficial for the render-time-heavy computations which should be isolated.

// TODO ### Build your own actions
