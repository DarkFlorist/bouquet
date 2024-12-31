import { RuntypeBase, Static } from './runtype';
export declare function assertType<TRuntypeBase extends RuntypeBase>(rt: TRuntypeBase, v: unknown): asserts v is Static<TRuntypeBase>;
