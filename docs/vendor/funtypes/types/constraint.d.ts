import { RuntypeBase, Static, Codec } from '../runtype';
import { Unknown } from './unknown';
export declare type ConstraintCheck<A extends RuntypeBase<unknown>> = (x: Static<A>) => boolean | string;
export interface Constraint<TUnderlying extends RuntypeBase<unknown>, TConstrained extends Static<TUnderlying> = Static<TUnderlying>, TArgs = unknown> extends Codec<TConstrained> {
    readonly tag: 'constraint';
    readonly underlying: TUnderlying;
    constraint(x: Static<TUnderlying>): boolean | string;
    readonly name?: string;
    readonly args?: TArgs;
}
export declare function Constraint<TUnderlying extends RuntypeBase<unknown>, TConstrained extends Static<TUnderlying> = Static<TUnderlying>, TArgs = unknown>(underlying: TUnderlying, constraint: ConstraintCheck<TUnderlying>, options?: {
    name?: string;
    args?: TArgs;
}): Constraint<TUnderlying, TConstrained, TArgs>;
export interface Guard<TConstrained, TArgs = unknown> extends Constraint<Unknown, TConstrained, TArgs> {
}
export declare const Guard: <T, K = unknown>(test: (x: unknown) => x is T, options?: {
    name?: string | undefined;
    args?: K | undefined;
} | undefined) => Guard<T, K>;
