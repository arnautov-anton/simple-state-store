type Patch<T> = (value: T) => T;
type Handler<T> = (nextValue: T) => any;

function isPatch<T>(value: T | Patch<T>): value is Patch<T> {
	return typeof value === "function";
}

export class SimpleStateStore<T> {
	private value: T;
	private handlerSet = new Set<Handler<T>>();

	constructor(initialValue: T) {
		this.value = initialValue;
	}

	public next = (newValue: T | Patch<T>) => {
		this.value = isPatch(newValue) ? newValue(this.value) : newValue;
		this.handlerSet.forEach((handler) => handler(this.value));
	};

	public getLatestValue = () => this.value;

	public subscribe = (handler: Handler<T>) => {
		handler(this.value);
		this.handlerSet.add(handler);
		return () => {
			this.handlerSet.delete(handler);
		};
	};
}
