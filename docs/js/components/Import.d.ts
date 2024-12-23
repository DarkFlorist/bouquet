import { Signal } from '@preact/signals';
import { ProviderStore } from '../library/provider.js';
import { Bundle, Signers } from '../types/types.js';
import { BouquetSettings } from '../types/bouquetTypes.js';
export declare function importFromInterceptor(bundle: Signal<Bundle | undefined>, provider: Signal<ProviderStore | undefined>, blockInfo: Signal<{
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
}>, signers: Signal<Signers> | undefined, bouquetSettings: Signal<BouquetSettings>): Promise<void>;
export declare const Import: ({ bundle, provider, blockInfo, signers, bouquetSettings, }: {
    bundle: Signal<Bundle | undefined>;
    provider: Signal<ProviderStore | undefined>;
    blockInfo: Signal<{
        blockNumber: bigint;
        baseFee: bigint;
        priorityFee: bigint;
    }>;
    signers: Signal<Signers>;
    bouquetSettings: Signal<BouquetSettings>;
}) => import("preact").JSX.Element;
//# sourceMappingURL=Import.d.ts.map