import { Static, RuntypeBase, Codec } from '../runtype';
export declare type StaticIntersect<TIntersectees extends readonly RuntypeBase<unknown>[]> = {
    [key in keyof TIntersectees]: TIntersectees[key] extends RuntypeBase ? (parameter: Static<TIntersectees[key]>) => any : unknown;
}[number] extends (k: infer I) => void ? I : never;
export interface Intersect<TIntersectees extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]]> extends Codec<StaticIntersect<TIntersectees>> {
    readonly tag: 'intersect';
    readonly intersectees: TIntersectees;
}
export declare function isIntersectRuntype(runtype: RuntypeBase): runtype is Intersect<[RuntypeBase, ...RuntypeBase[]]>;
/**
 * Construct an intersection runtype from runtypes for its alternatives.
 */
export declare function Intersect<TIntersectees extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]]>(...intersectees: TIntersectees): Intersect<TIntersectees>;
