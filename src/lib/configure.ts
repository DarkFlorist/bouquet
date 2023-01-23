import { derived } from 'svelte/store'
import {
	bundleContainsFundingTx,
	latestBlock,
	priorityFee,
	totalGas,
	totalValue,
} from '$lib/state'

export const targetFundingBalance = derived(
	[bundleContainsFundingTx, totalGas, totalValue, latestBlock, priorityFee],
	([
		$bundleContainsFundingTx,
		$totalGas,
		$totalValue,
		$latestBlock,
		$priorityFee,
	]) => {
		if ($bundleContainsFundingTx) {
			const gasPrice = $latestBlock.baseFee + $priorityFee
			// Total gas + 21k gas for sending funds from burner to compromised account + total value send from primary compromised account
			return gasPrice * (21000n + $totalGas) + $totalValue
		} else return 0n
	},
)
