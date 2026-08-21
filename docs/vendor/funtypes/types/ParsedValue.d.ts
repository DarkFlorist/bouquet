import { Result } from '../result';
import { RuntypeBase, Static, Codec } from '../runtype';
export interface ParsedValue<TUnderlying extends RuntypeBase<unknown>, TParsed> extends Codec<TParsed> {
    readonly tag: 'parsed';
    readonly underlying: TUnderlying;
    readonly config: ParsedValueConfig<TUnderlying, TParsed>;
}
export interface ParsedValueConfig<TUnderlying extends RuntypeBase<unknown>, TParsed> {
    name?: string;
    parse: (value: Static<TUnderlying>) => Result<TParsed>;
    serialize?: (value: TParsed) => Result<Static<TUnderlying>>;
    test?: RuntypeBase<TParsed>;
}
export declare function ParsedValue<TUnderlying extends RuntypeBase<unknown>, TParsed>(underlying: TUnderlying, config: ParsedValueConfig<TUnderlying, TParsed>): ParsedValue<TUnderlying, TParsed>;
