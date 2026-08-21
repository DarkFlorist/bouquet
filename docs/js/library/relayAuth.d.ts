import { Wallet } from 'ethers';
type RelayAuthStorage = Pick<Storage, 'getItem' | 'setItem'>;
export declare const getOrCreateRelayAuthSigner: (storage: RelayAuthStorage) => Wallet;
export {};
//# sourceMappingURL=relayAuth.d.ts.map