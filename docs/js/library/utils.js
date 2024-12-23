import { getAddress } from 'ethers';
import { EthereumAddress } from '../types/ethereumTypes.js';
import { serialize } from '../types/types.js';
export function addressString(address) {
    return getAddress(serialize(EthereumAddress, address));
}
export const min = (left, right) => left < right ? left : right;
//# sourceMappingURL=utils.js.map