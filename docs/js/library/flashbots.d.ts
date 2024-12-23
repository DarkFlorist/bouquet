import { BlockInfo, Bundle, Signers } from '../types/types.js';
import { ProviderStore } from './provider.js';
import { BouquetNetwork } from '../types/bouquetTypes.js';
import { EthSimulateV1CallResult, EthSimulateV1CallResults } from '../types/ethSimulateTypes.js';
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
export type SimulationResponseSuccess = {
    bundleGasPrice: bigint;
    bundleHash: string;
    coinbaseDiff: bigint;
    ethSentToCoinbase: bigint;
    gasFees: bigint;
    results: Array<TransactionSimulation>;
    totalGasUsed: bigint;
    stateBlockNumber: number;
    firstRevert: TransactionSimulation | undefined;
} | {
    totalGasUsed: bigint;
    firstRevert: EthSimulateV1CallResult & {
        toAddress: string;
        fromAddress: string | undefined;
    } | undefined;
    results: EthSimulateV1CallResults;
    gasFees: bigint;
};
export type SimulationResponse = SimulationResponseSuccess | RelayResponseError;
export declare function simulateBundle(bundle: Bundle, fundingAmountMin: bigint, provider: ProviderStore, signers: Signers, blockInfo: BlockInfo, network: BouquetNetwork): Promise<SimulationResponse>;
export declare function sendBundle(bundle: Bundle, targetBlock: bigint, fundingAmountMin: bigint, provider: ProviderStore, signers: Signers, blockInfo: BlockInfo, network: BouquetNetwork): Promise<{
    bundleTransactions: {
        signedTransaction: string;
        hash: string;
        account: string;
        nonce: bigint;
    }[];
    bundleIdentifier: any;
}>;
export declare function checkBundleInclusion(transactions: {
    hash: string;
}[], provider: ProviderStore): Promise<{
    transactions: {
        hash: string;
    }[];
    included: boolean;
    includedInBlocks: bigint[];
}>;
export {};
//# sourceMappingURL=flashbots.d.ts.map