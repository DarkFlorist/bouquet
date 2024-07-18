import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js';
import { ProviderStore } from './provider.js';
interface TransactionSimulationBase {
    txHash: string;
    gasUsed: number;
    gasFees: string;
    gasPrice: string;
    toAddress: string;
    fromAddress: string;
    coinbaseDiff: string;
}
export interface TransactionSimulationSuccess extends TransactionSimulationBase {
    value: string;
    ethSentToCoinbase: string;
}
export interface TransactionSimulationRevert extends TransactionSimulationBase {
    error: string;
    revert: string;
}
export type TransactionSimulation = TransactionSimulationSuccess | TransactionSimulationRevert;
export interface RelayResponseError {
    error: {
        message: string;
        code: number;
    };
}
export interface SimulationResponseSuccess {
    bundleGasPrice: bigint;
    bundleHash: string;
    coinbaseDiff: bigint;
    ethSentToCoinbase: bigint;
    gasFees: bigint;
    results: Array<TransactionSimulation>;
    totalGasUsed: number;
    stateBlockNumber: number;
    firstRevert?: TransactionSimulation;
}
export type SimulationResponse = SimulationResponseSuccess | RelayResponseError;
export declare function simulateBundle(bundle: Bundle, fundingAmountMin: bigint, provider: ProviderStore, signers: Signers, blockInfo: BlockInfo, appSettings: AppSettings): Promise<{
    error: {
        message: any;
        code: any;
    };
    bundleGasPrice?: undefined;
    bundleHash?: undefined;
    coinbaseDiff?: undefined;
    ethSentToCoinbase?: undefined;
    gasFees?: undefined;
    results?: undefined;
    stateBlockNumber?: undefined;
    totalGasUsed?: undefined;
    firstRevert?: undefined;
} | {
    bundleGasPrice: bigint;
    bundleHash: any;
    coinbaseDiff: bigint;
    ethSentToCoinbase: bigint;
    gasFees: bigint;
    results: any;
    stateBlockNumber: any;
    totalGasUsed: any;
    firstRevert: any;
    error?: undefined;
}>;
export declare function sendBundle(bundle: Bundle, targetBlock: bigint, fundingAmountMin: bigint, provider: ProviderStore, signers: Signers, blockInfo: BlockInfo, appSettings: AppSettings): Promise<{
    bundleTransactions: {
        signedTransaction: string;
        hash: string;
        account: string;
        nonce: bigint;
    }[];
    bundleHash: any;
}>;
export declare function checkBundleInclusion(transactions: {
    hash: string;
}[], provider: ProviderStore): Promise<{
    transactions: {
        hash: string;
    }[];
    included: boolean;
}>;
export {};
//# sourceMappingURL=flashbots.d.ts.map