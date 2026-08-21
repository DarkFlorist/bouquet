import { TransactionList } from '../types/bouquetTypes.js';
import { Bundle } from '../types/types.js';
export declare const isClearDelegationTransaction: (transaction: TransactionList[number]) => boolean;
export declare const createBundle: (transactions: readonly ({
    readonly from: bigint | "FUNDING";
    readonly to: bigint | null;
    readonly value: bigint;
    readonly input: Uint8Array;
    readonly chainId: bigint;
    readonly gasLimit: bigint;
} & {
    readonly type?: "1559" | "7702" | undefined;
    readonly accessList?: readonly {
        readonly address: bigint;
        readonly storageKeys: readonly bigint[];
    }[] | undefined;
    readonly authorizationList?: readonly ({
        readonly chainId: bigint;
        readonly address: bigint;
        readonly nonce: bigint;
    } & {
        readonly authority?: bigint | undefined;
        readonly r?: bigint | undefined;
        readonly s?: bigint | undefined;
        readonly yParity?: "even" | "odd" | undefined;
    })[] | undefined;
})[]) => Bundle;
//# sourceMappingURL=bundle.d.ts.map