import { ReadonlySignal, Signal } from '@preact/signals';
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js';
import { ProviderStore } from '../library/provider.js';
type PendingBundle = {
    bundles: {
        [bundleHash: string]: {
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
    };
};
export declare const Bundles: ({ outstandingBundles, provider }: {
    outstandingBundles: Signal<PendingBundle>;
    provider: Signal<ProviderStore | undefined>;
}) => import("preact").JSX.Element;
export declare const Submit: ({ provider, bundle, fundingAmountMin, signers, appSettings, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
    fundingAmountMin: ReadonlySignal<bigint>;
    appSettings: Signal<AppSettings>;
    blockInfo: Signal<BlockInfo>;
}) => import("preact").JSX.Element;
export {};
//# sourceMappingURL=Submit.d.ts.map