import { ReadonlySignal, Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { ProviderStore } from '../library/provider.js';
import { BlockInfo, BundleState, Signers } from '../library/types.js';
export declare const Configure: ({ provider, interceptorPayload, fundingAmountMin, signers, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    interceptorPayload: Signal<BundleState | undefined>;
    signers: Signal<Signers>;
    fundingAmountMin: ReadonlySignal<bigint>;
    blockInfo: Signal<BlockInfo>;
}) => JSX.Element;
//# sourceMappingURL=Configure.d.ts.map