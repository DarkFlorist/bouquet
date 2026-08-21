import { RuntypeBase, Codec } from '../runtype';
export declare type StaticTuple<TElements extends readonly RuntypeBase<unknown>[]> = {
    [key in keyof TElements]: TElements[key] extends RuntypeBase<infer E> ? E : unknown;
};
export declare type ReadonlyStaticTuple<TElements extends readonly RuntypeBase<unknown>[]> = {
    readonly [key in keyof TElements]: TElements[key] extends RuntypeBase<infer E> ? E : unknown;
};
export interface Tuple<TElements extends readonly RuntypeBase<unknown>[] = readonly RuntypeBase<unknown>[]> extends Codec<StaticTuple<TElements>> {
    readonly tag: 'tuple';
    readonly components: TElements;
    readonly isReadonly: false;
}
export interface ReadonlyTuple<TElements extends readonly RuntypeBase<unknown>[] = readonly RuntypeBase<unknown>[]> extends Codec<ReadonlyStaticTuple<TElements>> {
    readonly tag: 'tuple';
    readonly components: TElements;
    readonly isReadonly: true;
}
export declare function isTupleRuntype(runtype: RuntypeBase): runtype is Tuple<readonly RuntypeBase[]>;
/**
 * Construct a tuple runtype from runtypes for each of its elements.
 */
export declare function Tuple<T extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]] | readonly []>(...components: T): Tuple<T>;
export declare function ReadonlyTuple<T extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]] | readonly []>(...components: T): ReadonlyTuple<T>;
