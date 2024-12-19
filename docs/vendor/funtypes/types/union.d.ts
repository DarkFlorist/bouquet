import { Codec, Static, RuntypeBase } from '../runtype';
export declare type StaticUnion<TAlternatives extends readonly RuntypeBase<unknown>[]> = {
    [key in keyof TAlternatives]: TAlternatives[key] extends RuntypeBase<unknown> ? Static<TAlternatives[key]> : unknown;
}[number];
export interface Union<TAlternatives extends readonly RuntypeBase<unknown>[]> extends Codec<StaticUnion<TAlternatives>> {
    readonly tag: 'union';
    readonly alternatives: TAlternatives;
    match: Match<TAlternatives>;
}
export declare function isUnionType(runtype: RuntypeBase): runtype is Union<RuntypeBase<unknown>[]>;
/**
 * Construct a union runtype from runtypes for its alternatives.
 */
export declare function Union<TAlternatives extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]]>(...alternatives: TAlternatives): Union<TAlternatives>;
export interface Match<A extends readonly RuntypeBase<unknown>[]> {
    <Z>(...a: {
        [key in keyof A]: A[key] extends RuntypeBase<unknown> ? Case<A[key], Z> : never;
    }): Matcher<A, Z>;
}
export declare type Case<T extends RuntypeBase<unknown>, Result> = (v: Static<T>) => Result;
export declare type Matcher<A extends readonly RuntypeBase<unknown>[], Z> = (x: {
    [key in keyof A]: A[key] extends RuntypeBase<infer Type> ? Type : unknown;
}[number]) => Z;
