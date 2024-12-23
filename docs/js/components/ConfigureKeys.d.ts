import { Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { ProviderStore } from '../library/provider.js';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
export declare const ConfigureKeys: ({ provider, bundle, signers, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
    blockInfo: Signal<BlockInfo>;
}) => JSX.Element;
//# sourceMappingURL=ConfigureKeys.d.ts.map