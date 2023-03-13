import { ReadonlySignal, Signal } from '@preact/signals';
import { AppSettings, BlockInfo, BundleInfo, BundleState, Signers } from '../library/types.js';
import { ProviderStore } from '../library/provider.js';
export declare const Bundles: ({ pendingBundles, appSettings, }: {
    pendingBundles: Signal<{
        lastBlock: bigint;
        active: boolean;
        pendingBundles: BundleInfo[];
    }>;
    appSettings: Signal<AppSettings>;
}) => import("preact").JSX.Element;
export declare const Submit: ({ provider, interceptorPayload, fundingAmountMin, signers, appSettings, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    interceptorPayload: Signal<BundleState | undefined>;
    signers: Signal<Signers>;
    fundingAmountMin: ReadonlySignal<bigint>;
    appSettings: Signal<AppSettings>;
    blockInfo: Signal<BlockInfo>;
}) => import("preact").JSX.Element;
//# sourceMappingURL=Submit.d.ts.map