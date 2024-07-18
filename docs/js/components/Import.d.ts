import { Signal } from '@preact/signals';
import { ProviderStore } from '../library/provider.js';
import { AppSettings, Bundle, Signers } from '../types/types.js';
export declare function importFromInterceptor(bundle: Signal<Bundle | undefined>, provider: Signal<ProviderStore | undefined>, blockInfo: Signal<{
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
}>, appSettings: Signal<AppSettings>, signers: Signal<Signers> | undefined): Promise<void>;
export declare const Import: ({ bundle, provider, blockInfo, signers, appSettings, }: {
    bundle: Signal<Bundle | undefined>;
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