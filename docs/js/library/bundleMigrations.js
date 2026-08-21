import { createRescueBundle, ensureDelegationClearFunding } from './rescue.js';
export const migrateBundleIfNeeded = (bundle) => {
    const transactionsWithFunding = ensureDelegationClearFunding(bundle.transactions);
    if (transactionsWithFunding === bundle.transactions)
        return bundle;
    return createRescueBundle(transactionsWithFunding);
};
//# sourceMappingURL=bundleMigrations.js.map