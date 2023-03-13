import { Signal } from '@preact/signals';
import { ProviderStore } from '../library/provider.js';
import { AppSettings, BlockInfo } from '../library/types.js';
export declare const NetworkDetails: ({ blockInfo, provider, appSettings, }: {
    blockInfo: Signal<BlockInfo>;
    provider: Signal<ProviderStore | undefined>;
    appSettings: Signal<AppSettings>;
}) => import("preact").JSX.Element;
//# sourceMappingURL=NetworkDetails.d.ts.map