import { Static, RuntypeBase, Codec } from '../runtype';
import { String, Number } from './primative';
import { Literal } from './literal';
import { Constraint } from './constraint';
import { Union } from './union';
export declare type KeyRuntypeBaseWithoutUnion = Pick<String, keyof RuntypeBase> | Pick<Number, keyof RuntypeBase> | Pick<Literal<string | number>, 'value' | keyof RuntypeBase> | Pick<Constraint<KeyRuntypeBase, string | number>, 'underlying' | keyof RuntypeBase>;
export declare type KeyRuntypeBase = KeyRuntypeBaseWithoutUnion | Pick<Union<KeyRuntypeBaseWithoutUnion[]>, 'alternatives' | keyof RuntypeBase>;
export interface Record<K extends KeyRuntypeBase, V extends RuntypeBase<unknown>> extends Codec<{
    [_ in Static<K>]?: Static<V>;
}> {
    readonly tag: 'record';
    readonly key: K;
    readonly value: V;
    readonly isReadonly: false;
}
export interface ReadonlyRecord<K extends KeyRuntypeBase, V extends RuntypeBase<unknown>> extends Codec<{
    readonly [_ in Static<K>]?: Static<V>;
}> {
    readonly tag: 'record';
    readonly key: K;
    readonly value: V;
    readonly isReadonly: true;
}
/**
 * Construct a runtype for arbitrary dictionaries.
 */
export declare function Record<K extends KeyRuntypeBase, V extends RuntypeBase<unknown>>(key: K, value: V): Record<K, V>;
export declare function ReadonlyRecord<K extends KeyRuntypeBase, V extends RuntypeBase<unknown>>(key: K, value: V): ReadonlyRecord<K, V>;
