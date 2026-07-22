export const shouldSubmitForBlock = ({ active, inProgress, lastBlock, currentBlock }: {
	active: boolean
	inProgress: boolean
	lastBlock: bigint
	currentBlock: bigint
}) => active && !inProgress && currentBlock > lastBlock

export const describeBundleTarget = (currentBlock: bigint, targetBlock: bigint) => {
	if (targetBlock < currentBlock) return `Target block ${targetBlock.toString()} has passed; preparing the next target.`
	if (targetBlock === currentBlock) return `Waiting for the inclusion result for block ${targetBlock.toString()}.`
	const blocksAhead = targetBlock - currentBlock
	return `Trying bundle inclusion in block ${targetBlock.toString()} (${blocksAhead.toString()} block${blocksAhead === 1n ? '' : 's'} ahead).`
}

export const latestBundleTarget = <T extends { targetBlock: bigint }>(bundles: readonly T[]): T | undefined => bundles.reduce<T | undefined>((latest, bundle) => latest === undefined || bundle.targetBlock > latest.targetBlock ? bundle : latest, undefined)

export const hasTargetBlockBeenMined = (currentBlock: bigint, targetBlock: bigint) => targetBlock <= currentBlock
