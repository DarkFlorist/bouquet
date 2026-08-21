import { RuntypeBase, Codec } from '../runtype';
/**
 * The super type of all literal types.
 */
export declare type LiteralValue = undefined | null | boolean | number | string;
export interface Literal<TLiteralValue extends LiteralValue = LiteralValue> extends Codec<TLiteralValue> {
    readonly tag: 'literal';
    readonly value: TLiteralValue;
}
export declare function isLiteralRuntype(runtype: RuntypeBase): runtype is Literal;
/**
 * Construct a runtype for a type literal.
 */
export declare function Literal<A extends LiteralValue>(valueBase: A): Literal<A>;
/**
 * An alias for Literal(undefined).
 */
export declare const Undefined: Literal<undefined>;
/**
 * An alias for Literal(null).
 */
export declare const Null: Literal<null>;
