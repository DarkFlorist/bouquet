import assert from 'node:assert/strict'
import test from 'node:test'
import { MAX_RELAY_SUBMISSION_ATTEMPTS, relayNonInclusionError, shouldSubmitForBlock } from '../app/js/library/submission.js'

test('polling submits only a newer block while submission is active and idle', () => {
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: false, lastBlock: 100n, currentBlock: 101n }), true)
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: false, lastBlock: 100n, currentBlock: 100n }), false)
	assert.equal(shouldSubmitForBlock({ active: false, inProgress: false, lastBlock: 100n, currentBlock: 101n }), false)
	assert.equal(shouldSubmitForBlock({ active: true, inProgress: true, lastBlock: 100n, currentBlock: 101n }), false)
})

test('relay non-inclusion reports the bounded target-block limit', () => {
	const message = relayNonInclusionError('Sepolia').message
	assert.match(message, new RegExp(`${MAX_RELAY_SUBMISSION_ATTEMPTS} target blocks`))
	assert.match(message, /on Sepolia/)
})
