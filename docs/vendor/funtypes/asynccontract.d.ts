import { RuntypeBase } from './runtype';
export interface AsyncContract<A extends any[], Z> {
    enforce(f: (...a: A) => Promise<Z>): (...a: A) => Promise<Z>;
}
/**
 * Create a function contract.
 */
export declare function AsyncContract<A extends [any, ...any[]] | [], Z>(argTypes: {
    [key in keyof A]: key extends 'length' ? A['length'] : RuntypeBase<A[key]>;
}, returnType: RuntypeBase<Z>): AsyncContract<A, Z>;
