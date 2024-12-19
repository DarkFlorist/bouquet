import { ReadonlySignal, Signal } from '@preact/signals';
import { JSXInternal } from 'preact/src/jsx.js';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
import { ProviderStore } from '../library/provider.js';
import { BouquetSettings } from '../types/bouquetTypes.js';
export declare const Transactions: ({ provider, bundle, blockInfo, bouquetSettings, signers, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    blockInfo: Signal<BlockInfo>;
    signers: Signal<Signers>;
    bouquetSettings: Signal<BouquetSettings>;
    fundingAmountMin: ReadonlySignal<bigint>;
}) => JSXInternal.Element;
//# sourceMappingURL=Transactions.d.ts.map