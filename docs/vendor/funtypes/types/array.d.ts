import { Static, RuntypeBase, Codec } from '../runtype';
export interface ReadonlyArray<E extends RuntypeBase<unknown> = RuntypeBase<unknown>> extends Codec<readonly Static<E>[]> {
    readonly tag: 'array';
    readonly element: E;
    readonly isReadonly: true;
}
export { Arr as Array };
interface Arr<E extends RuntypeBase<unknown> = RuntypeBase<unknown>> extends Codec<Static<E>[]> {
    readonly tag: 'array';
    readonly element: E;
    readonly isReadonly: false;
    asReadonly(): ReadonlyArray<E>;
}
declare function Arr<TElement extends RuntypeBase<unknown>>(element: TElement): Arr<TElement>;
export declare function ReadonlyArray<TElement extends RuntypeBase<unknown>>(element: TElement): ReadonlyArray<TElement>;
