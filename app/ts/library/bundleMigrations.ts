import { Bundle } from '../types/types.js'
import { createRescueBundle, ensureDelegationClearFunding } from './rescue.js'

export const migrateBundleIfNeeded = (bundle: Bundle): Bundle => {
	const transactionsWithFunding = ensureDelegationClearFunding(bundle.transactions)
	if (transactionsWithFunding === bundle.transactions) return bundle
	return createRescueBundle(transactionsWithFunding)
}
