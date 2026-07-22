export const shouldSubmitForBlock = ({ active, inProgress, lastBlock, currentBlock }: {
	active: boolean
	inProgress: boolean
	lastBlock: bigint
	currentBlock: bigint
}) => active && !inProgress && currentBlock > lastBlock

export const describeBundleTarget = (currentBlock: bigint, targetBlock: bigint) => {
	if (targetBlock < currentBlock) return `Current block ${currentBlock.toString()}. Target block ${targetBlock.toString()} has passed; preparing the next target.`
	if (targetBlock === currentBlock) return `Current block ${currentBlock.toString()}. Waiting for the inclusion result for block ${targetBlock.toString()}.`
	const blocksAhead = targetBlock - currentBlock
	return `Current block ${currentBlock.toString()}. Trying bundle inclusion in block ${targetBlock.toString()} (${blocksAhead.toString()} block${blocksAhead === 1n ? '' : 's'} ahead).`
}

export const latestBundleTarget = <T extends { targetBlock: bigint }>(bundles: readonly T[]): T | undefined => bundles.reduce<T | undefined>((latest, bundle) => latest === undefined || bundle.targetBlock > latest.targetBlock ? bundle : latest, undefined)
