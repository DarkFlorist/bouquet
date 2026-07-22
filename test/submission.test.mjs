import assert from 'node:assert/strict'
import test from 'node:test'
import { describeBundleTarget, shouldSubmitForBlock } from '../app/js/library/submission.js'

test('polling submits only a newer block while submission is active and idle', () => {
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: false, lastBlock: 100n, currentBlock: 101n }), true)
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: false, lastBlock: 100n, currentBlock: 100n }), false)
	assert.equal(shouldSubmitForBlock({ active: false, inProgress: false, lastBlock: 100n, currentBlock: 101n }), false)
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: true, lastBlock: 100n, currentBlock: 101n }), false)
})

test('submission status explains the current and target blocks', () => {
	assert.equal(describeBundleTarget(100n, 103n), 'Current block 100. Trying bundle inclusion in block 103 (3 blocks ahead).')
	assert.equal(describeBundleTarget(100n, 101n), 'Current block 100. Trying bundle inclusion in block 101 (1 block ahead).')
	assert.equal(describeBundleTarget(101n, 100n), 'Current block 101. Target block 100 has passed; preparing the next target.')
})
