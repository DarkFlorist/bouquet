import assert from 'node:assert/strict'
import test from 'node:test'
import { describeBundleTarget, getBundleTargetBlocks, hasTargetBlockBeenMined, latestBundleTarget, shouldSubmitForBlock } from '../app/js/library/submission.js'
import { getFutureFeeProjection, getMaxBaseFeeInFutureBlock, withPriorityFee } from '../app/js/library/bundleUtils.js'
import { createRelaySimulationPayload } from '../app/js/library/flashbots.js'

test('polling submits only a newer block while submission is active and idle', () => {
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: false, lastBlock: 100n, currentBlock: 101n }), true)
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: false, lastBlock: 100n, currentBlock: 100n }), false)
	assert.equal(shouldSubmitForBlock({ active: false, inProgress: false, lastBlock: 100n, currentBlock: 101n }), false)
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: true, lastBlock: 100n, currentBlock: 101n }), false)
})

test('submission status explains the target relative to the current block', () => {
	assert.equal(describeBundleTarget(100n, 103n), 'Trying bundle inclusion in block 103 (3 blocks ahead).')
	assert.equal(describeBundleTarget(100n, 101n), 'Trying bundle inclusion in block 101 (1 block ahead).')
	assert.equal(describeBundleTarget(100n, 100n), 'Waiting for the inclusion result for block 100.')
	assert.equal(describeBundleTarget(101n, 100n), 'Target block 100 has passed; preparing the next target.')
})

test('only the newest accepted target is presented as active', () => {
	const latest = latestBundleTarget([{ targetBlock: 101n }, { targetBlock: 103n }, { targetBlock: 102n }])
	assert.equal(latest.targetBlock, 103n)
})

test('a target is complete as soon as its block is the latest mined block', () => {
	assert.equal(hasTargetBlockBeenMined(100n, 100n), true)
	assert.equal(hasTargetBlockBeenMined(100n, 101n), false)
})

test('every future block in the configured window is targeted', () => {
	assert.deepEqual(getBundleTargetBlocks(100n, 3n), [101n, 102n, 103n])
	assert.throws(() => getBundleTargetBlocks(100n, 0n), /positive/)
})

test('pending targets are refreshed closer to inclusion on the next block', () => {
	const firstTargets = getBundleTargetBlocks(100n, 3n)
	const nextTargets = getBundleTargetBlocks(101n, 3n)
	assert.deepEqual(firstTargets.filter((target) => nextTargets.includes(target)), [102n, 103n])
	assert.equal(nextTargets.at(-1), 104n)
})

test('maximum base fee compounds for every future block', () => {
	assert.equal(getMaxBaseFeeInFutureBlock(1_000_000_000n, 1n), 1_125_000_001n)
	assert.equal(getMaxBaseFeeInFutureBlock(1_000_000_000n, 3n), 1_423_828_128n)
})

test('future fee projection uses the configured target distance and priority fee', () => {
	assert.deepEqual(
		getFutureFeeProjection(
			{ baseFee: 1_000_000_000n },
			{ blocksInFuture: 3n, priorityFee: 2_000_000_000n },
		),
		{
			baseFee: 1_423_828_128n,
			priorityFee: 2_000_000_000n,
			maxFeePerGas: 3_423_828_128n,
		},
	)
})

test('configured priority fee replaces the default used for signing', () => {
	assert.deepEqual(withPriorityFee({ blockNumber: 100n, baseFee: 2n, priorityFee: 3n }, 9n), { blockNumber: 100n, baseFee: 2n, priorityFee: 9n })
})

test('relay simulation uses the actual future target block', () => {
	const payload = JSON.parse(createRelaySimulationPayload(['0x1234'], 103n))
	assert.equal(payload.params[0].blockNumber, '0x67')
	assert.equal(payload.params[0].stateBlockNumber, 'latest')
})
