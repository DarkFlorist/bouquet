export const MAX_RELAY_SUBMISSION_ATTEMPTS = 25

export const shouldSubmitForBlock = ({ active, inProgress, lastBlock, currentBlock }: {
	active: boolean
	inProgress: boolean
	lastBlock: bigint
	currentBlock: bigint
}) => active && !inProgress && currentBlock > lastBlock

export const relayNonInclusionError = (networkName: string) => new Error(`Bundle was not included after ${MAX_RELAY_SUBMISSION_ATTEMPTS} target blocks on ${networkName}. The relay accepted the bundle but no builder included it. Review the priority fee and try again.`)
