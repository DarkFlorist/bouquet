import { Codec } from '../runtype';
export interface Never extends Codec<never> {
    readonly tag: 'never';
}
/**
 * Validates nothing (unknown fails).
 */
export declare const Never: Never;
