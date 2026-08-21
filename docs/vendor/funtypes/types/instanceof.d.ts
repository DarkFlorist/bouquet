import { Codec } from '../runtype';
export interface Constructor<V> {
    new (...args: any[]): V;
}
export interface InstanceOf<V = unknown> extends Codec<V> {
    readonly tag: 'instanceof';
    readonly ctor: Constructor<V>;
}
export declare function InstanceOf<V>(ctor: Constructor<V>): InstanceOf<V>;
