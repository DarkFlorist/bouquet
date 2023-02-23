import { ReadonlySignal, Signal } from '@preact/signals'
import { utils } from 'ethers'
import { createBundleTransactions } from '../library/bundleUtils.js'
import { FlashbotsBundleTransaction } from '../library/flashbots-ethers-provider.js'
import { AppSettings, BlockInfo, BundleState, Signers } from '../library/types.js'

export const TransactionList = ({ transactions, fundingTx }: { transactions: FlashbotsBundleTransaction[]; fundingTx: boolean }) => {
	return (
		<div class='flex w-full flex-col gap-2'>
			{transactions.map((tx, index) => (
				<div class='flex w-full min-h-[96px]'>
					<div class='flex w-24 flex-col items-center justify-center rounded-l bg-accent text-background'>
						<span class='text-lg font-light'>#{index}</span>
					</div>
					<div class='bg-card flex w-full justify-center flex-col gap-2 rounded-r p-4 text-sm font-semibold'>
						<p>
							From{' '}
							<span class='rounded bg-background p-1 font-mono'>
								{fundingTx && tx.transaction.from === transactions[0].transaction.from ? 'FUNDING WALLET' : tx.transaction.from}
							</span>{' '}
							➝ To <span class='rounded bg-background p-1 font-mono'>{tx.transaction.to}</span>
						</p>
						<p>
							Value: <span class='font-mono'>{utils.formatEther(tx.transaction.value ?? 0n)}</span> Ether
						</p>
						{tx.transaction.data && tx.transaction.data !== '0x' && tx.transaction.data.length > 0 ? (
							<p class='flex gap-2'>
								Calldata: <span class='rounded bg-background p-1 font-mono w-full break-all'>{tx.transaction.data.toString()}</span>
							</p>
						) : undefined}
					</div>
				</div>
			))}
		</div>
	)
}

export const Transactions = ({
	interceptorPayload,
	signers,
	blockInfo,
	appSettings,
	fundingAmountMin,
}: {
	interceptorPayload: Signal<BundleState | undefined>
	blockInfo: Signal<BlockInfo>
	signers: Signal<Signers>
	appSettings: Signal<AppSettings>
	fundingAmountMin: ReadonlySignal<bigint>
}) => {
	const transactions = createBundleTransactions(
		interceptorPayload.peek(),
		signers.peek(),
		blockInfo.peek(),
		appSettings.peek().blocksInFuture,
		fundingAmountMin.peek(),
	)

	return (
		<>
			<h2 className='font-bold text-2xl'>Your Transactions</h2>
			<TransactionList {...{ transactions, fundingTx: interceptorPayload.peek()?.containsFundingTx ?? false }} />
		</>
	)
}
