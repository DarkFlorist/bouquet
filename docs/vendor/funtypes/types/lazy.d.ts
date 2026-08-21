import { RuntypeBase, Codec, Static } from '../runtype';
export interface Lazy<TUnderlying extends RuntypeBase<unknown>> extends Codec<Static<TUnderlying>> {
    readonly tag: 'lazy';
    readonly underlying: () => TUnderlying;
}
export declare function lazyValue<T>(fn: () => T): () => T;
/**
 * Construct a possibly-recursive Runtype.
 */
export declare function Lazy<TUnderlying extends RuntypeBase<unknown>>(delayed: () => TUnderlying): Lazy<TUnderlying>;
