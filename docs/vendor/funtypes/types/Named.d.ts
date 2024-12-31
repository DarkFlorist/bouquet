import { RuntypeBase, Static, Codec } from '../runtype';
export declare type ConstraintCheck<A extends RuntypeBase<unknown>> = (x: Static<A>) => boolean | string;
export interface Named<TUnderlying extends RuntypeBase<unknown>> extends Codec<Static<TUnderlying>> {
    readonly tag: 'named';
    readonly underlying: TUnderlying;
    readonly name: string;
}
export declare function Named<TUnderlying extends RuntypeBase<unknown>>(name: string, underlying: TUnderlying): Named<TUnderlying>;
