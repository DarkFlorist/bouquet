export declare const shouldSubmitForBlock: ({ active, inProgress, lastBlock, currentBlock }: {
    active: boolean;
    inProgress: boolean;
    lastBlock: bigint;
    currentBlock: bigint;
}) => boolean;
export declare const describeBundleTarget: (currentBlock: bigint, targetBlock: bigint) => string;
export declare const latestBundleTarget: <T extends {
    targetBlock: bigint;
}>(bundles: readonly T[]) => T | undefined;
export declare const hasTargetBlockBeenMined: (currentBlock: bigint, targetBlock: bigint) => boolean;
export declare const getBundleTargetBlocks: (currentBlock: bigint, blocksInFuture: bigint) => bigint[];
//# sourceMappingURL=submission.d.ts.map