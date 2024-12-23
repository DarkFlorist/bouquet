import { Wallet } from 'ethers';
import * as t from 'funtypes';
import { TransactionList } from './bouquetTypes.js';
export declare function serialize<T, U extends t.Codec<T>>(funtype: U, value: T): ToWireType<U>;
export type UnionToIntersection<T> = (T extends unknown ? (k: T) => void : never) extends (k: infer I) => void ? I : never;
export type ToWireType<T> = T extends t.Intersect<infer U> ? UnionToIntersection<{
    [I in keyof U]: ToWireType<U[I]>;
}[number]> : T extends t.Union<infer U> ? {
    [I in keyof U]: ToWireType<U[I]>;
}[number] : T extends t.Record<infer U, infer V> ? Record<t.Static<U>, ToWireType<V>> : T extends t.Partial<infer U, infer V> ? V extends true ? {
    readonly [K in keyof U]?: ToWireType<U[K]>;
} : {
    [K in keyof U]?: ToWireType<U[K]>;
} : T extends t.Object<infer U, infer V> ? V extends true ? {
    readonly [K in keyof U]: ToWireType<U[K]>;
} : {
    [K in keyof U]: ToWireType<U[K]>;
} : T extends t.Readonly<t.Tuple<infer U>> ? {
    readonly [P in keyof U]: ToWireType<U[P]>;
} : T extends t.Tuple<infer U> ? {
    [P in keyof U]: ToWireType<U[P]>;
} : T extends t.ReadonlyArray<infer U> ? readonly ToWireType<U>[] : T extends t.Array<infer U> ? ToWireType<U>[] : T extends t.ParsedValue<infer U, infer _> ? ToWireType<U> : T extends t.Codec<infer U> ? U : never;
export type HexString = `0x${string}`;
interface Eip1193Provider {
    request(request: {
        method: string;
        params?: Array<any> | Record<string, any>;
    }): Promise<any>;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
}
declare global {
    interface Window {
        ethereum?: Eip1193Provider;
    }
}
export type BlockInfo = {
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
};
export type Bundle = {
    transactions: TransactionList;
    containsFundingTx: boolean;
    totalGas: bigint;
    inputValue: bigint;
    uniqueSigners: string[];
};
export type Signers = {
    burner: Wallet | undefined;
    burnerBalance: bigint;
    bundleSigners: {
        [account: string]: Wallet;
    };
};
export type PromiseState = 'pending' | 'resolved' | 'rejected';
export type BundleInfo = {
    hash: string;
    state: PromiseState;
    details: string;
};
export {};
//# sourceMappingURL=types.d.ts.map