import { Signal } from '@preact/signals';
import { providers } from 'ethers';
import { FlashbotsBundleProvider, FlashbotsBundleTransaction, FlashbotsTransactionResponse } from './flashbots-ethers-provider.js';
import { ProviderStore } from './provider.js';
import { BlockInfo, BundleState, Signers } from './types.js';
export declare const getMaxBaseFeeInFutureBlock: (baseFee: bigint, blocksInFuture: bigint) => bigint;
export declare const createProvider: (provider: Signal<ProviderStore | undefined>) => Promise<FlashbotsBundleProvider>;
export declare const signBundle: (bundle: FlashbotsBundleTransaction[], provider: providers.Web3Provider, blockInfo: BlockInfo, maxBaseFee: bigint) => Promise<string[]>;
export declare const createBundleTransactions: (interceptorPayload: BundleState | undefined, signers: Signers, blockInfo: BlockInfo, blocksInFuture: bigint, fundingAmountMin: bigint) => FlashbotsBundleTransaction[];
export declare function simulate(flashbotsProvider: FlashbotsBundleProvider, walletProvider: providers.Web3Provider, blockInfo: BlockInfo, blocksInFuture: bigint, bundleData: BundleState, signers: Signers, fundingAmountMin: bigint): Promise<import("./flashbots-ethers-provider.js").SimulationResponse>;
export declare function sendBundle(flashbotsProvider: FlashbotsBundleProvider, walletProvider: providers.Web3Provider, blockInfo: BlockInfo, blocksInFuture: bigint, bundleData: BundleState, signers: Signers, fundingAmountMin: bigint): Promise<FlashbotsTransactionResponse>;
//# sourceMappingURL=bundleUtils.d.ts.map