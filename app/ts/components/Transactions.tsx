import { batch, ReadonlySignal, Signal } from '@preact/signals'
import { utils } from 'ethers'
import { createBundleTransactions } from '../library/bundleUtils.js'
import { FlashbotsBundleTransaction } from '../library/flashbots-ethers-provider'
import { AppSettings, AppStages, BlockInfo, BundleState, Signers } from '../library/types'
import { Button } from './Button.js'

export const TransactionList = ({ transactions, fundingTx }: { transactions: FlashbotsBundleTransaction[]; fundingTx: boolean }) => {
	return (
		<div class='flex w-full flex-col gap-4'>
			{transactions.map((tx, index) => (
				<div class='flex w-full min-h-[96px]'>
					{index === 0 && fundingTx ? (
						<div class='flex w-24 flex-col items-center justify-center rounded-l bg-success text-background'>
							<span class='text-xs font-semibold'>Funding TX</span>
							<span class='text-lg font-light'>#{index}</span>
						</div>
					) : (
						<div class='flex w-24 flex-col items-center justify-center rounded-l bg-accent text-background'>
							<span class='text-lg font-light'>#{index}</span>
						</div>
					)}
					<div class='bg-card flex w-full justify-center flex-col gap-2 rounded-r p-4 text-sm font-semibold'>
						<p>
							From <span class='rounded bg-background p-1 font-mono'>{tx.transaction.from}</span> ➝ To{' '}
							<span class='rounded bg-background p-1 font-mono'>{tx.transaction.to}</span>
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
	stage,
}: {
	interceptorPayload: Signal<BundleState | undefined>
	blockInfo: Signal<BlockInfo>
	signers: Signal<Signers>
	appSettings: Signal<AppSettings>
	fundingAmountMin: ReadonlySignal<bigint>
	stage: Signal<AppStages>
}) => {
	const clearPayload = () => {
		batch(() => {
			interceptorPayload.value = undefined
			localStorage.removeItem('payload')
			signers.value.bundleSigners = {}
			// Keep burner wallet as long as it has funds, should clear is later if there is left over dust but not needed.
			// if (fundingAccountBalance.value === 0n) signers.value.burner = undefined
			stage.value = 'import'
		})
	}

	const transactions = createBundleTransactions(
		interceptorPayload.peek(),
		signers.peek(),
		blockInfo.peek(),
		appSettings.peek().blocksInFuture,
		fundingAmountMin.peek(),
	)

	return (
		<>
			<div class='flex gap-4 items-center'>
				<h2 class='text-3xl font-extrabold'>Your Transactions</h2>
				<Button onClick={clearPayload}>Reset</Button>
			</div>
			<TransactionList {...{ transactions, fundingTx: interceptorPayload.peek()?.containsFundingTx ?? false }} />
		</>
	)
}
