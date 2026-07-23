import assert from 'node:assert/strict'
import test from 'node:test'
import { signal } from '@preact/signals'
import { Wallet } from 'ethers'
import { updateLatestBlock } from '../app/js/library/provider.js'

test('provider block updates refresh block metadata and the funding balance together', async () => {
	const burner = Wallet.createRandom()
	const providerStore = {
		provider: {
			getBalance: async (address) => {
				assert.equal(address, burner.address)
				return 42n
			},
		},
	}
	const provider = signal(providerStore)
	const blockInfo = signal({ blockNumber: 1n, baseFee: 2n, priorityFee: 3n })
	const signers = signal({ burner, burnerBalance: 0n, bundleSigners: {} })

	await updateLatestBlock({ number: 10, baseFeePerGas: 7n }, provider, blockInfo, signers)

	assert.deepEqual(blockInfo.value, { blockNumber: 10n, baseFee: 7n, priorityFee: 3n })
	assert.equal(signers.value.burnerBalance, 42n)
})
