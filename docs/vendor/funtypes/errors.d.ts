import { Failure, FullError } from './result';
export declare class ValidationError extends Error {
    name: string;
    readonly shortMessage: string;
    readonly key: string | undefined;
    readonly fullError: FullError | undefined;
    constructor(failure: Omit<Failure, 'success'>);
}
