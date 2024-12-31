import { BrowserProvider, Signer, TransactionRequest } from 'ethers';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
export interface FlashbotsBundleTransaction {
    transaction: TransactionRequest;
    signer: Signer;
}
export declare const getMaxBaseFeeInFutureBlock: (baseFee: bigint, blocksInFuture: bigint) => bigint;
export declare const getRawTransactionsAndCalculateFeesAndNonces: (bundle: FlashbotsBundleTransaction[], provider: BrowserProvider, blockInfo: BlockInfo, maxBaseFee: bigint) => Promise<{
    rawTransaction: string;
    transaction: TransactionRequest;
}[]>;
export declare const createBundleTransactions: (bundle: Bundle, signers: Signers, blockInfo: BlockInfo, blocksInFuture: bigint, fundingAmountMin: bigint) => FlashbotsBundleTransaction[];
//# sourceMappingURL=bundleUtils.d.ts.map