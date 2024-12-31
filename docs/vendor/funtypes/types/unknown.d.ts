import { Codec } from '../runtype';
export interface Unknown extends Codec<unknown> {
    readonly tag: 'unknown';
}
/**
 * Validates anything, but provides no new type information about it.
 */
export declare const Unknown: Unknown;
