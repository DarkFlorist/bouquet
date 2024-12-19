import { Signal } from '@preact/signals';
import { Block, BrowserProvider, HDNodeWallet } from 'ethers';
import { EthereumAddress } from '../types/ethereumTypes.js';
import { BlockInfo, Signers } from '../types/types.js';
import { BouquetSettings } from '../types/bouquetTypes.js';
export type ProviderStore = {
    provider: BrowserProvider;
    _clearEvents: () => unknown;
    authSigner: HDNodeWallet;
    walletAddress: EthereumAddress;
    chainId: bigint;
    isInterceptor: boolean;
};
export declare const connectBrowserProvider: (store: Signal<ProviderStore | undefined>, blockInfo: Signal<{
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
}>, signers: Signal<Signers> | undefined, bouquetSettings: Signal<BouquetSettings>) => Promise<void>;
export declare function updateLatestBlock(block: Block, provider: Signal<ProviderStore | undefined>, blockInfo: Signal<BlockInfo>, signers: Signal<Signers> | undefined): Promise<void>;
//# sourceMappingURL=provider.d.ts.map