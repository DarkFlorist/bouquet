import { Wallet } from 'ethers';
const RELAY_AUTH_PRIVATE_KEY_STORAGE_KEY = 'relayAuthPrivateKey';
const parseStoredSigner = (privateKey) => {
    try {
        return new Wallet(privateKey);
    }
    catch {
        return undefined;
    }
};
export const getOrCreateRelayAuthSigner = (storage) => {
    const storedPrivateKey = storage.getItem(RELAY_AUTH_PRIVATE_KEY_STORAGE_KEY);
    if (storedPrivateKey !== null) {
        const storedSigner = parseStoredSigner(storedPrivateKey);
        if (storedSigner !== undefined)
            return storedSigner;
    }
    const signer = new Wallet(Wallet.createRandom().privateKey);
    storage.setItem(RELAY_AUTH_PRIVATE_KEY_STORAGE_KEY, signer.privateKey);
    return signer;
};
//# sourceMappingURL=relayAuth.js.map