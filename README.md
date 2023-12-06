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

const store = SimpleStateStore(initialState);

const unsubscribe = store.subscribe(console.log); // logs initial state on subscription

store.next({
	...initialState,
	user: {
		...initialState.user,
		age: 31,
	},
});

// or with patch function

store.next((previousValue) => ({
	...previousValue,
	user: { ...previousValue.user, age: 32 },
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

```tsx
import { useStore } from "simple-state-store";

const Component = () => {
	const [age, hobbies] = useStore(store, (nextValue) => [
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

### Build your own actions
