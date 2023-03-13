import { ReadonlySignal, Signal } from '@preact/signals';
import { JSXInternal } from 'preact/src/jsx.js';
import { FlashbotsBundleTransaction } from '../library/flashbots-ethers-provider.js';
import { AppSettings, BlockInfo, BundleState, Signers } from '../library/types.js';
export declare const TransactionList: ({ parsedTransactions, fundingTx, }: {
    parsedTransactions: Signal<(FlashbotsBundleTransaction & {
        decoded?: JSXInternal.Element;
    })[]>;
    fundingTx: boolean;
}) => JSXInternal.Element;
export declare const Transactions: ({ interceptorPayload, signers, blockInfo, appSettings, fundingAmountMin, }: {
    interceptorPayload: Signal<BundleState | undefined>;
    blockInfo: Signal<BlockInfo>;
    signers: Signal<Signers>;
    appSettings: Signal<AppSettings>;
    fundingAmountMin: ReadonlySignal<bigint>;
}) => JSXInternal.Element;
//# sourceMappingURL=Transactions.d.ts.map