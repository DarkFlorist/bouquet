import { Signal } from '@preact/signals';
import { ProviderStore } from '../library/provider.js';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
import { BouquetSettings } from '../types/bouquetTypes.js';
export declare const Navbar: ({ provider, bouquetSettings, blockInfo, bundle, signers }: {
    provider: Signal<ProviderStore | undefined>;
    blockInfo: Signal<BlockInfo>;
    bouquetSettings: Signal<BouquetSettings>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
}) => import("preact").JSX.Element;
//# sourceMappingURL=Navbar.d.ts.map