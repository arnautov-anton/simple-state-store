type Patch<T> = (value: T) => T;

function isPatch<T>(value: T | Patch<T>): value is Patch<T> {
	return typeof value === "function";
}

export const SimpleStateStore = <T>(initialValue: T) => {
	let value = initialValue;
	const handlerSet = new Set<(_: T) => void>();

	const next = (newValue: T | Patch<T>) => {
		value = isPatch(newValue) ? newValue(value) : newValue;
		handlerSet.forEach((h) => h(value));
	};

	const subscribe = (handler: (_: T) => void) => {
		handler(value);
		handlerSet.add(handler);
		return () => {
			handlerSet.delete(handler);
		};
	};

	const getLatestValue = () => value;

	return { subscribe, next, getLatestValue } as const;
};

export type SimpleStateStore<T> = typeof SimpleStateStore<T>;
