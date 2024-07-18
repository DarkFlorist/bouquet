import { Signal } from '@preact/signals';
import { ProviderStore } from '../library/provider.js';
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js';
export declare const Navbar: ({ provider, appSettings, blockInfo, bundle, signers }: {
    provider: Signal<ProviderStore | undefined>;
    blockInfo: Signal<BlockInfo>;
    appSettings: Signal<AppSettings>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
}) => import("preact").JSX.Element;
//# sourceMappingURL=Navbar.d.ts.map