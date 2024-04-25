import { Codec } from '../runtype';
export interface Enum<TEnum extends {
    [key: string]: number | string;
}> extends Codec<TEnum[keyof TEnum]> {
    readonly tag: 'enum';
    readonly enumObject: TEnum;
}
export declare function Enum<TEnum extends {
    [key: string]: number | string;
}>(name: string, e: TEnum): Enum<TEnum>;
