import { ProviderStore } from './library/provider.js';
import { AppSettings, BlockInfo, Bundle, Signers } from './types/types.js';
export declare function createGlobalState(): {
    provider: import("@preact/signals-core").Signal<ProviderStore | undefined>;
    blockInfo: import("@preact/signals-core").Signal<BlockInfo>;
    bundle: import("@preact/signals-core").Signal<Bundle | undefined>;
    appSettings: import("@preact/signals-core").Signal<AppSettings>;
    signers: import("@preact/signals-core").Signal<Signers>;
    fundingAmountMin: import("@preact/signals-core").ReadonlySignal<bigint>;
};
//# sourceMappingURL=stores.d.ts.map