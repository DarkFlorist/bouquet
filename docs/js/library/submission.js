export const shouldSubmitForBlock = ({ active, inProgress, lastBlock, currentBlock }) => active && !inProgress && currentBlock > lastBlock;
export const describeBundleTarget = (currentBlock, targetBlock) => {
    if (targetBlock < currentBlock)
        return `Target block ${targetBlock.toString()} has passed; preparing the next target.`;
    if (targetBlock === currentBlock)
        return `Waiting for the inclusion result for block ${targetBlock.toString()}.`;
    const blocksAhead = targetBlock - currentBlock;
    return `Trying bundle inclusion in block ${targetBlock.toString()} (${blocksAhead.toString()} block${blocksAhead === 1n ? '' : 's'} ahead).`;
};
export const latestBundleTarget = (bundles) => bundles.reduce((latest, bundle) => latest === undefined || bundle.targetBlock > latest.targetBlock ? bundle : latest, undefined);
export const hasTargetBlockBeenMined = (currentBlock, targetBlock) => targetBlock <= currentBlock;
export const getBundleTargetBlocks = (currentBlock, blocksInFuture) => {
    if (blocksInFuture <= 0n)
        throw new Error('blocksInFuture needs to be positive');
    const targets = [];
    for (let offset = 1n; offset <= blocksInFuture; offset++)
        targets.push(currentBlock + offset);
    return targets;
};
//# sourceMappingURL=submission.js.map