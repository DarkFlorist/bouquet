import { Signal } from '@preact/signals';
import { ProviderStore } from '../library/provider.js';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
export declare const CreateClearDelegation: ({ bundle, provider, signers, blockInfo }: {
    bundle: Signal<Bundle | undefined>;
    provider: Signal<ProviderStore | undefined>;
    signers: Signal<Signers>;
    blockInfo: Signal<BlockInfo>;
}) => import("preact").JSX.Element | null;
//# sourceMappingURL=CreateClearDelegation.d.ts.map