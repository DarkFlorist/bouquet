import { Signal } from '@preact/signals';
import { providers } from 'ethers';
import { AppSettings, Signers } from './types.js';
export type ProviderStore = {
    provider: providers.Web3Provider;
    _clearEvents: () => unknown;
    walletAddress: string;
    chainId: number;
};
export declare const connectBrowserProvider: (store: Signal<ProviderStore | undefined>, appSettings: Signal<AppSettings>, blockInfo: Signal<{
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
}>, signers: Signal<Signers> | undefined) => Promise<void>;
export declare function updateLatestBlock(blockNumber: number, provider: Signal<ProviderStore | undefined>, blockInfo: Signal<{
    blockNumber: bigint;
    baseFee: bigint;
    priorityFee: bigint;
}>, signers: Signal<Signers> | undefined): Promise<void>;
//# sourceMappingURL=provider.d.ts.map