import { type Provider } from 'ethers';
import { TransactionList } from '../types/bouquetTypes.js';
import { Bundle } from '../types/types.js';
export type ClearDelegationTransactionInput = {
    authority: string;
    chainId: bigint;
};
export declare const parseEip7702DelegationTarget: (code: string) => string | undefined;
export declare const getActiveEip7702DelegationTarget: (provider: Pick<Provider, 'getCode'>, authority: string) => Promise<string | undefined>;
export declare const createClearDelegationTransaction: ({ authority, chainId }: ClearDelegationTransactionInput) => TransactionList[number];
export declare const ensureDelegationClearFunding: (transactions: readonly ({
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
})[]) => readonly ({
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
})[];
export declare const orderRescueTransactions: (transactions: readonly ({
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
})[]) => readonly ({
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
})[];
export declare const createRescueBundle: (transactions: readonly ({
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
//# sourceMappingURL=rescue.d.ts.map