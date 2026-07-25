import assert from 'node:assert/strict'
import test from 'node:test'
import { getOrCreateRelayAuthSigner } from '../app/js/library/relayAuth.js'

const createStorage = (initialValue) => {
	const values = new Map(initialValue === undefined ? [] : [['relayAuthPrivateKey', initialValue]])
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		values,
	}
}

test('relay authentication identity persists across wallet connections', () => {
	const storage = createStorage()
	const firstSigner = getOrCreateRelayAuthSigner(storage)
	const secondSigner = getOrCreateRelayAuthSigner(storage)
	assert.equal(secondSigner.address, firstSigner.address)
	assert.equal(storage.values.get('relayAuthPrivateKey'), firstSigner.privateKey)
})

test('invalid stored relay credentials are replaced', () => {
	const storage = createStorage('invalid')
	const signer = getOrCreateRelayAuthSigner(storage)
	assert.equal(storage.values.get('relayAuthPrivateKey'), signer.privateKey)
})
