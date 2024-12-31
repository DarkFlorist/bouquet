import { RuntypeBase, Static, Codec } from '../runtype';
export interface Sealed<TUnderlying extends RuntypeBase<unknown>> extends Codec<Static<TUnderlying>> {
    readonly tag: 'sealed';
    readonly underlying: TUnderlying;
    readonly deep: boolean;
}
export interface SealedConfig {
    readonly deep?: boolean;
}
export declare function Sealed<TUnderlying extends RuntypeBase<unknown>>(underlying: TUnderlying, { deep }?: SealedConfig): Sealed<TUnderlying>;
