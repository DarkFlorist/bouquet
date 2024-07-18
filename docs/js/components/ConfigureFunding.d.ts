import { ReadonlySignal, Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { ProviderStore } from '../library/provider.js';
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js';
export declare const ConfigureFunding: ({ provider, appSettings, bundle, fundingAmountMin, signers, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
    fundingAmountMin: ReadonlySignal<bigint>;
    blockInfo: Signal<BlockInfo>;
    appSettings: Signal<AppSettings>;
}) => JSX.Element;
//# sourceMappingURL=ConfigureFunding.d.ts.map