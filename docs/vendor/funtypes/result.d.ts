import type { RuntypeBase } from './runtype';
export declare function success<T>(value: T): Success<T>;
export declare function failure(message: string, options?: Omit<Failure, 'success' | 'message'>): Failure;
export declare function expected(expected: RuntypeBase | string, value: unknown, options?: Omit<Failure, 'success' | 'message'>): Failure;
declare type FullErrorInput = FullError | Failure | string;
export declare function unableToAssign(value: unknown, expected: RuntypeBase | string, ...children: FullErrorInput[]): FullError;
export declare function andError([msg, ...children]: FullError): FullError;
export declare function typesAreNotCompatible(property: string, ...children: FullErrorInput[]): FullError;
/**
 * A successful validation result.
 */
export declare type Success<T> = {
    /**
     * A tag indicating success.
     */
    success: true;
    /**
     * The original value, cast to its validated type.
     */
    value: T;
};
/**
 * A failed validation result.
 */
export declare type Failure = {
    /**
     * A tag indicating failure.
     */
    success: false;
    /**
     * A message indicating the reason validation failed.
     */
    message: string;
    fullError?: FullError;
    /**
     * A key indicating the location at which validation failed.
     */
    key?: string;
};
export declare type FullError = [string, ...FullError[]];
/**
 * The result of a type validation.
 */
export declare type Result<T> = Success<T> | Failure;
export declare function showError(failure: Omit<Failure, 'success'>): string;
export declare function showFullError([title, ...children]: FullError, indent?: string): string;
export {};
