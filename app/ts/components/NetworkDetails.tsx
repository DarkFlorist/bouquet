import { Signal } from '@preact/signals'
import { utils } from 'ethers'
import { BlockInfo } from '../library/types'

export const NetworkDetails = ({ blockInfo }: { blockInfo: Signal<BlockInfo> }) => {
	return (
		<div class='flex flex-wrap items-center justify-center gap-4'>
			<span>Current Block: {blockInfo.value.blockNumber.toString()}</span>
			<span>Base Fee: {utils.formatUnits(blockInfo.value.baseFee, 'gwei')} gwei</span>
		</div>
	)
}
