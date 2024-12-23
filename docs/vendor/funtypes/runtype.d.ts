import type * as t from '.';
import type { Result, Failure } from './result';
import { ParsedValueConfig } from './types/ParsedValue';
interface Helpers {
    readonly Union: typeof t.Union;
    readonly Intersect: typeof t.Intersect;
    readonly Constraint: typeof t.Constraint;
    readonly Brand: typeof t.Brand;
    readonly ParsedValue: typeof t.ParsedValue;
}
export declare function provideHelpers(h: Helpers): void;
export declare type InnerValidateHelper = <T>(runtype: RuntypeBase<T>, value: unknown) => Result<T>;
declare const internalSymbol: unique symbol;
declare const internal: typeof internalSymbol;
export declare function assertRuntype(...values: RuntypeBase[]): void;
export declare function isRuntype(value: unknown): value is RuntypeBase;
export declare type ResultWithCycle<T> = (Result<T> & {
    cycle?: false;
}) | Cycle<T>;
export declare type SealedState = {
    readonly keysFromIntersect?: ReadonlySet<string>;
    readonly deep: boolean;
} | false;
export interface InternalValidation<TParsed> {
    /**
     * parse
     */
    p(x: any, innerValidate: <T>(runtype: RuntypeBase<T>, value: unknown, sealed?: SealedState) => Result<T>, innerValidateToPlaceholder: <T>(runtype: RuntypeBase<T>, value: unknown, sealed?: SealedState) => ResultWithCycle<T>, mode: 'p' | 's' | 't', sealed: SealedState): ResultWithCycle<TParsed>;
    /**
     * test
     */
    t?: (x: any, innerValidate: <T>(runtype: RuntypeBase<T>, value: unknown, sealed?: SealedState) => Failure | undefined, sealed: SealedState, isOptionalTest: boolean) => Failure | undefined;
    /**
     * serialize
     */
    s?: (x: any, innerSerialize: (runtype: RuntypeBase, value: unknown, sealed?: SealedState) => Result<any>, innerSerializeToPlaceholder: (runtype: RuntypeBase, value: unknown, sealed?: SealedState) => ResultWithCycle<any>, mode: 's', sealed: SealedState) => ResultWithCycle<any>;
    /**
     * get underlying type
     */
    u?: (mode: 'p' | 's' | 't') => RuntypeBase | undefined;
    /**
     * get fields, not called if "u" is implemented, can return
     * undefined to indicate that arbitrarily many fields are
     * possible.
     */
    f?: (mode: 'p' | 't' | 's') => ReadonlySet<string> | undefined;
}
/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface RuntypeBase<TParsed = unknown> {
    readonly tag: string;
    /**
     * Verifies that a value conforms to this runtype. When given a value that does
     * not conform to the runtype, throws an exception.
     *
     * @throws ValidationError
     */
    assert(x: any): asserts x is TParsed;
    /**
     * A type guard for this runtype.
     */
    test(x: any): x is TParsed;
    /**
     * Validates the value conforms to this type, and performs
     * the `parse` action for any `ParsedValue` types.
     *
     * If the value is valid, it returns the parsed value,
     * otherwise it throws a ValidationError.
     *
     * @throws ValidationError
     */
    parse(x: any): TParsed;
    /**
     * Validates the value conforms to this type, and performs
     * the `parse` action for any `ParsedValue` types.
     *
     * Returns a `Result`, constaining the parsed value or
     * error message. Does not throw!
     */
    safeParse(x: any): Result<TParsed>;
    show?: (needsParens: boolean) => string;
    [internal]: InternalValidation<TParsed>;
}
/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface Runtype<TParsed> extends RuntypeBase<TParsed> {
    /**
     * Union this Runtype with another.
     */
    Or<B extends RuntypeBase>(B: B): t.Union<[this, B]>;
    /**
     * Intersect this Runtype with another.
     */
    And<B extends RuntypeBase>(B: B): t.Intersect<[this, B]>;
    /**
     * Use an arbitrary constraint function to validate a runtype, and optionally
     * to change its name and/or its static type.
     *
     * @template T - Optionally override the static type of the resulting runtype
     * @param {(x: Static<this>) => boolean | string} constraint - Custom function
     * that returns `true` if the constraint is satisfied, `false` or a custom
     * error message if not.
     * @param [options]
     * @param {string} [options.name] - allows setting the name of this
     * constrained runtype, which is helpful in reflection or diagnostic
     * use-cases.
     */
    withConstraint<T extends Static<this>, K = unknown>(constraint: t.ConstraintCheck<this>, options?: {
        name?: string;
        args?: K;
    }): t.Constraint<this, T, K>;
    /**
     * Helper function to convert an underlying Runtype into another static type
     * via a type guard function.  The static type of the runtype is inferred from
     * the type of the test function.
     *
     * @template T - Typically inferred from the return type of the type guard
     * function, so usually not needed to specify manually.
     * @param {(x: Static<this>) => x is T} test - Type test function (see
     * https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
     *
     * @param [options]
     * @param {string} [options.name] - allows setting the name of this
     * constrained runtype, which is helpful in reflection or diagnostic
     * use-cases.
     */
    withGuard<T extends Static<this>, K = unknown>(test: (x: Static<this>) => x is T, options?: {
        name?: string;
        args?: K;
    }): t.Constraint<this, T, K>;
    /**
     * Adds a brand to the type.
     */
    withBrand<B extends string>(brand: B): t.Brand<B, this>;
    /**
     * Apply conversion functions when parsing/serializing this value
     */
    withParser<TParsed>(value: ParsedValueConfig<this, TParsed>): t.ParsedValue<this, TParsed>;
}
export interface Codec<TParsed> extends Runtype<TParsed> {
    /**
     * Validates the value conforms to this type, and performs
     * the `serialize` action for any `ParsedValue` types.
     *
     * If the value is valid, and the type supports serialize,
     * it returns the serialized value, otherwise it throws a
     * ValidationError.
     *
     * @throws ValidationError
     */
    serialize: (x: TParsed) => unknown;
    /**
     * Validates the value conforms to this type, and performs
     * the `serialize` action for any `ParsedValue` types.
     *
     * Returns a `Result`, constaining the serialized value or
     * error message. Does not throw!
     */
    safeSerialize: (x: TParsed) => Result<unknown>;
}
/**
 * Obtains the static type associated with a Runtype.
 */
export declare type Static<A extends RuntypeBase<any>> = A extends RuntypeBase<infer T> ? T : unknown;
export declare function create<TConfig extends Codec<any>>(tag: TConfig['tag'], internalImplementation: InternalValidation<Static<TConfig>> | InternalValidation<Static<TConfig>>['p'], config: Omit<TConfig, typeof internal | 'tag' | 'assert' | 'test' | 'parse' | 'safeParse' | 'serialize' | 'safeSerialize' | 'Or' | 'And' | 'withConstraint' | 'withGuard' | 'withBrand' | 'withParser'>): TConfig;
export declare type Cycle<T> = {
    success: true;
    cycle: true;
    placeholder: Partial<T>;
    unwrap: () => Result<T>;
};
/**
 * Get the underlying type of a runtype, if it is a wrapper around another type
 */
export declare function unwrapRuntype(t: RuntypeBase, mode: 'p' | 's' | 't'): RuntypeBase;
export declare function createValidationPlaceholder<T>(placeholder: T, fn: (placeholder: T) => Failure | undefined): Cycle<T>;
export declare function mapValidationPlaceholder<T, S>(source: ResultWithCycle<T>, fn: (placeholder: T) => Result<S>, extraGuard?: RuntypeBase<S>): ResultWithCycle<S>;
declare const OpaqueVisitedState: unique symbol;
export declare type OpaqueVisitedState = typeof OpaqueVisitedState;
export declare function createVisitedState(): OpaqueVisitedState;
declare const OpaqueGuardVisitedState: unique symbol;
export declare type OpaqueGuardVisitedState = typeof OpaqueGuardVisitedState;
export declare function createGuardVisitedState(): OpaqueGuardVisitedState;
export declare function innerValidate<T>(targetType: RuntypeBase<T>, value: any, $visited: OpaqueVisitedState, sealed: SealedState): Result<T>;
export declare function innerSerialize<T>(targetType: RuntypeBase<T>, value: any, $visited: OpaqueVisitedState, sealed: SealedState): Result<T>;
export declare function innerGuard(targetType: RuntypeBase, value: any, $visited: OpaqueGuardVisitedState, sealed: SealedState, isOptionalTest: boolean): Failure | undefined;
/**
 * Get the possible fields for a runtype
 * Returns "undefined" if there can be arbitrary fields (e.g. Record<string, number>)
 */
export declare function getFields(t: RuntypeBase, mode: 'p' | 's' | 't'): ReadonlySet<string> | undefined;
export {};
