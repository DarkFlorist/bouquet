import { Codec } from '../runtype';
export interface KeyOf<TObject extends Object> extends Codec<keyof TObject> {
    readonly tag: 'keyOf';
    readonly keys: Set<string>;
}
export declare function KeyOf<TObject extends Object>(object: TObject): KeyOf<TObject>;
