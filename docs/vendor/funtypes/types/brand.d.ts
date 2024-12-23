import { RuntypeBase, Static, Codec } from '../runtype';
export declare const RuntypeName: unique symbol;
export interface Brand<B extends string, A extends RuntypeBase<unknown>> extends Codec<Static<A> & {
    [RuntypeName]: B;
}> {
    readonly tag: 'brand';
    readonly brand: B;
    readonly entity: A;
}
export declare function Brand<B extends string, A extends RuntypeBase<unknown>>(brand: B, entity: A): Brand<B, A>;
