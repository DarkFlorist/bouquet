import { Codec } from '../runtype';
export interface Boolean extends Codec<boolean> {
    readonly tag: 'boolean';
}
export interface Function extends Codec<(...args: any[]) => any> {
    readonly tag: 'function';
}
export interface Number extends Codec<number> {
    readonly tag: 'number';
}
export interface String extends Codec<string> {
    readonly tag: 'string';
}
interface Sym extends Codec<symbol> {
    readonly tag: 'symbol';
}
/**
 * Validates that a value is a boolean.
 */
export declare const Boolean: Boolean;
/**
 * Validates that a value is a function.
 */
export declare const Function: Function;
/**
 * Validates that a value is a number.
 */
export declare const Number: Number;
/**
 * Validates that a value is a string.
 */
export declare const String: String;
/**
 * Validates that a value is a symbol.
 */
declare const Sym: Sym;
export { Sym as Symbol };
