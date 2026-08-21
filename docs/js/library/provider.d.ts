import { Signal } from '@preact/signals';
import { Block, BrowserProvider, Wallet } from 'ethers';
import { EthereumAddress } from '../types/ethereumTypes.js';
import { BlockInfo, Signers } from '../types/types.js';
import { BouquetSettings } from '../types/bouquetTypes.js';
export type ProviderStore = {
    provider: BrowserProvider;
    _clearEvents: () => unknown;
    startFastBlockPolling: (onError: (error: unknown) => void) => () => void;
    authSigner: Wallet;
    walletAddress: EthereumAddress;
    chainId: bigint;
    isInterceptor: boolean;
};
export declare const connectBrowserProvider: (store: Signal<ProviderStore | undefined>, blockInfo: Signal<{
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
}>, signers: Signal<Signers> | undefined, bouquetSettings: Signal<BouquetSettings>, options?: {
    isInterceptor?: boolean;
}) => Promise<void>;
export declare function updateLatestBlock(block: Block, provider: Signal<ProviderStore | undefined>, blockInfo: Signal<BlockInfo>, signers: Signal<Signers> | undefined): Promise<void>;
//# sourceMappingURL=provider.d.ts.map