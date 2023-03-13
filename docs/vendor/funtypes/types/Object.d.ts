import { Static, RuntypeBase, Codec } from '../runtype';
export declare type RecordFields = {
    readonly [_: string]: RuntypeBase<unknown>;
};
declare type RecordStaticType<O extends RecordFields, IsPartial extends boolean, IsReadonly extends boolean> = IsPartial extends false ? IsReadonly extends false ? {
    -readonly [K in keyof O]: Static<O[K]>;
} : {
    readonly [K in keyof O]: Static<O[K]>;
} : IsReadonly extends false ? {
    -readonly [K in keyof O]?: Static<O[K]>;
} : {
    readonly [K in keyof O]?: Static<O[K]>;
};
export interface InternalRecord<O extends RecordFields, IsPartial extends boolean, IsReadonly extends boolean> extends Codec<RecordStaticType<O, IsPartial, IsReadonly>> {
    readonly tag: 'object';
    readonly fields: O;
    readonly isPartial: IsPartial;
    readonly isReadonly: IsReadonly;
    asPartial(): Partial<O, IsReadonly>;
    asReadonly(): IsPartial extends false ? Obj<O, true> : Partial<O, true>;
    pick<TKeys extends [keyof O, ...(keyof O)[]]>(...keys: TKeys): InternalRecord<Pick<O, TKeys[number]>, IsPartial, IsReadonly>;
    omit<TKeys extends [keyof O, ...(keyof O)[]]>(...keys: TKeys): InternalRecord<Omit<O, TKeys[number]>, IsPartial, IsReadonly>;
}
export { Obj as Object };
declare type Obj<O extends RecordFields, IsReadonly extends boolean> = InternalRecord<O, false, IsReadonly>;
export declare type Partial<O extends RecordFields, IsReadonly extends boolean> = InternalRecord<O, true, IsReadonly>;
export declare function isObjectRuntype(runtype: RuntypeBase): runtype is InternalRecord<RecordFields, boolean, boolean>;
/**
 * Construct an object runtype from runtypes for its values.
 */
export declare function InternalObject<O extends RecordFields, Part extends boolean, RO extends boolean>(fields: O, isPartial: Part, isReadonly: RO): InternalRecord<O, Part, RO>;
declare function Obj<O extends RecordFields>(fields: O): Obj<O, false>;
export declare function ReadonlyObject<O extends RecordFields>(fields: O): Obj<O, true>;
export declare function Partial<O extends RecordFields>(fields: O): Partial<O, false>;
export declare function ReadonlyPartial<O extends RecordFields>(fields: O): Partial<O, true>;
