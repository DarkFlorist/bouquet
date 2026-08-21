import { ReadonlySignal, Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { ProviderStore } from '../library/provider.js';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
import { BouquetSettings } from '../types/bouquetTypes.js';
export declare const ConfigureFunding: ({ provider, bouquetSettings, bundle, fundingAmountMin, signers, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
    fundingAmountMin: ReadonlySignal<bigint>;
    blockInfo: Signal<BlockInfo>;
    bouquetSettings: Signal<BouquetSettings>;
}) => JSX.Element;
//# sourceMappingURL=ConfigureFunding.d.ts.map