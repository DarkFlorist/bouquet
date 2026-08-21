import { BrowserProvider, Signer, TransactionRequest } from 'ethers';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
export interface FlashbotsBundleTransaction {
    transaction: TransactionRequest;
    signer: Signer;
}
export declare const getMaxBaseFeeInFutureBlock: (baseFee: bigint, blocksInFuture: bigint) => bigint;
export declare const getFutureFeeProjection: (blockInfo: Pick<BlockInfo, 'baseFee'>, feeSettings: {
    blocksInFuture: bigint;
    priorityFee: bigint;
}) => {
    baseFee: bigint;
    priorityFee: bigint;
    maxFeePerGas: bigint;
};
export declare const withPriorityFee: (blockInfo: BlockInfo, priorityFee: bigint) => BlockInfo;
export declare const getRawTransactionsAndCalculateFeesAndNonces: (bundle: Bundle, signers: Signers, provider: BrowserProvider, blockInfo: BlockInfo, blocksInFuture: bigint, fundingAmountMin: bigint, maxBaseFee: bigint) => Promise<{
    rawTransaction: string;
    transaction: TransactionRequest;
}[]>;
export declare const createBundleTransactions: (bundle: Bundle, signers: Signers, blockInfo: BlockInfo, blocksInFuture: bigint, fundingAmountMin: bigint, authorizationNonces: Readonly<{
    [address: string]: bigint;
}>) => Promise<FlashbotsBundleTransaction[]>;
//# sourceMappingURL=bundleUtils.d.ts.map