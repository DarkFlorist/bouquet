import { RuntypeBase } from './runtype';
export interface Contract<A extends any[], Z> {
    enforce(f: (...a: A) => Z): (...a: A) => Z;
}
/**
 * Create a function contract.
 */
export declare function Contract<A extends [any, ...any[]] | [], Z>(argTypes: {
    [key in keyof A]: key extends 'length' ? A['length'] : RuntypeBase<A[key]>;
}, returnType: RuntypeBase<Z>): Contract<A, Z>;
