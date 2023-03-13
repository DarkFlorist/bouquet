import { Signal } from '@preact/signals';
import { ProviderStore } from '../library/provider.js';
import { AppSettings, BundleState, Signers } from '../library/types.js';
export declare function importFromInterceptor(interceptorPayload: Signal<BundleState | undefined>, provider: Signal<ProviderStore | undefined>, blockInfo: Signal<{
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
}>, appSettings: Signal<AppSettings>, signers: Signal<Signers> | undefined): Promise<void>;
export declare const Import: ({ interceptorPayload, provider, blockInfo, signers, appSettings, }: {
    interceptorPayload: Signal<BundleState | undefined>;
    provider: Signal<ProviderStore | undefined>;
    blockInfo: Signal<{
        blockNumber: bigint;
        baseFee: bigint;
        priorityFee: bigint;
    }>;
    signers: Signal<Signers>;
    appSettings: Signal<AppSettings>;
}) => import("preact").JSX.Element;
//# sourceMappingURL=Import.d.ts.map