import { Signal } from '@preact/signals';
export type Inactive = {
    state: 'inactive';
};
export type Pending = {
    state: 'pending';
};
export type Resolved<T> = {
    state: 'resolved';
    value: T;
};
export type Rejected = {
    state: 'rejected';
    error: Error;
};
export type AsyncProperty<T> = Inactive | Pending | Resolved<T> | Rejected;
export type AsyncState<T> = {
    value: Signal<AsyncProperty<T>>;
    waitFor: (resolver: () => Promise<T>) => void;
    reset: () => void;
};
export declare function useAsyncState<T>(): AsyncState<T>;
//# sourceMappingURL=asyncState.d.ts.map