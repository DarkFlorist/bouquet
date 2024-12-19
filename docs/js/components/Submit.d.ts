import { ReadonlySignal, Signal } from '@preact/signals';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
import { ProviderStore } from '../library/provider.js';
import { BouquetNetwork, BouquetSettings } from '../types/bouquetTypes.js';
type PendingBundle = {
    bundles: {
        [bundleIdentifier: string]: {
            targetBlock: bigint;
            gas: {
                priorityFee: bigint;
                baseFee: bigint;
            };
            transactions: {
                signedTransaction: string;
                hash: string;
                account: string;
                nonce: bigint;
            }[];
            included: boolean;
        };
    };
    error?: Error;
    success?: {
        targetBlock: bigint;
        gas: {
            priorityFee: bigint;
            baseFee: bigint;
        };
        transactions: {
            signedTransaction: string;
            hash: string;
            account: string;
            nonce: bigint;
        }[];
        included: boolean;
        includedInBlocks: bigint[];
    };
};
export declare const Bundles: ({ outstandingBundles, bouquetNetwork, }: {
    outstandingBundles: Signal<PendingBundle>;
    bouquetNetwork: Signal<BouquetNetwork>;
}) => import("preact").JSX.Element;
export declare const Submit: ({ provider, bundle, fundingAmountMin, signers, bouquetSettings, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
    fundingAmountMin: ReadonlySignal<bigint>;
    bouquetSettings: Signal<BouquetSettings>;
    blockInfo: Signal<BlockInfo>;
}) => import("preact").JSX.Element;
export {};
//# sourceMappingURL=Submit.d.ts.map