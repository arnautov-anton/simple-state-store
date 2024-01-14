# Simple State Store

Very simple state management tool which combines power of RxJS BehaviorSubject and selectors for atomic updates.

> **Note:** While this package certainly works - I do not recommend using it in production as this is only for education purposes - mostly for me. I like designs of Zustand and RxJS and to understand some of the core principles the packages offer I wrote this one implementing "something" from each one.

## How to use it

### Vanilla

```tsx
import { SimpleStateStore } from "simple-state-store";

const initialState = {
  user: {
    name: "John",
    age: 30,
    hobbies: {
      biking: { skillLevel: 15 },
      fishing: { skillLevel: 5 },
    },
  },
};

const store = new SimpleStateStore(initialState);

const unsubscribe = store.subscribe(console.log); // logs initial state on subscription

store.next({
  user: {
    name: "Mark",
    age: 31,
    hobbies: {
      swimming: { skillLevel: 30 },
      hiking: { skillLevel: 44 },
    },
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

React triggers re-renders _mainly_ with state updates - in the example bellow you can see that `age` and `hobbies` have been extracted from the "global" state as these two values are being rendered within one component. While it's fine to do so in this example the problem would appear if this component relied on some heavy render-time calculation which was based on `hobbies` value. Each time you'd change `age` - `useStateStore` would re-run your selector and through comparison would realize that `age` has changed, triggering the component re-render unnecessarily slowing down your application by re-running action that was unnecessary to re-run in the first place.

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
      <span>{Object.keys(hobbies).join(",")}</span>
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

  return <span>{Object.keys(hobbies).join(",")}</span>;
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

#### Rules of selectors

Make sure your selectors are stable - either live outside component's scope or are memoized through `useCallback` or `useMemo`. Hook `useStateStore` uses your selectors in a `useEffect` behind the scenes as one of the dependencies. If the selected members change, internal `setState` will be called triggering re-run of your component and with unstable selector will cause re-run of the mentioned effect.

Don't do this (this is only for demo purposes):

```tsx
const AgeRenderer = () => {
  const [age] = useStateStore(store, (nextValue) => [nextValue.user.age]);

  return <span>{age}</span>;
};
```

Do this instead:

```tsx
import { type StateStoreSelector } from "simple-state-store/react";

const ageSelector: StateStoreSelector<typeof store> = (nextValue) => [
  nextValue.user.age,
];

const AgeRenderer = () => {
  const [age] = useStateStore(store, ageSelector);

  return <span>{age}</span>;
};
```

Or this if your selector relies on some external values:

```tsx
import { type StateStoreSelector } from "simple-state-store/react";

const HobbyRenderer = ({ hobbyType }: { hobbyType: string }) => {
  const hobbySelector = useCallback<StateStoreSelector<typeof store>>(
    (nextValue) => [nextValue.user.hobbies[hobbyType]],
    [hobbyType]
  );

  const [hobbyData] = useStateStore(store, hobbySelector);

  return (
    <span>
      {hobbyType}: {hobbyData.skillLevel}
    </span>
  );
};
```

### Build your own update actions

Each store - like in Zustand - can be built with initiator function which allows you to access and take advantage of `get` and `set` functions to build your own update store "methods":

```ts
const store = new SimpleStateStore((get, set) => ({
  pizzaToppings: ["cheese"],
  addPizzaTopping: (topping: string) => {
    set(
      // utilizing patch function with the help of ImmerJS
      produce((draft) => {
        draft.pizzaToppings.push(topping);
      })
    );
  },
  removePizzaToping: (toppingIndex: number) => {
    const state = get();

    const newPizzaToppings = state.pizzaToppings.filter(
      (_, index) => index !== toppingIndex
    );

    set({
      ...state,
      pizzaToppings: newPizzaToppings,
    });
  },
}));
```

Using such actions can be achieved by accessing `store.actions` which is a `store.getLatestValue` shortcut under the hood (in future will only return values of type `Function`):

```tsx
const PizzaToppingButton = (topping: string) => {
  return (
    <button onClick={() => store.actions.addPizzaTopping(topping)}>
      Add {topping}!
    </button>
  );
};
```

Since these actions have everything they need to update the state they have the ownership of there's no need for their signatures to change throughout the application lifetime and can be considered as "stable" - using such actions within effects should be safe without adding them to the dependency array (your `store` object should be sufficient). There might be cases where you'd want to add/remove actions with specific contexts (closures) to your state during application runtime but I have yet to run into such case - it's certainly possible through the use of `store.next` and `store.getLatestValue` methods but generally not recommended.
