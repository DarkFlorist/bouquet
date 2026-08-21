import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { batch, useSignal, useSignalEffect } from '@preact/signals';
import { Wallet } from 'ethers';
export const ConfigureKeys = ({ provider, bundle, signers, blockInfo, }) => {
    const signerKeys = useSignal({});
    useSignalEffect(() => {
        if (!bundle.value)
            signerKeys.value = {};
        if (bundle.value && bundle.value.uniqueSigners.join() !== Object.keys(signerKeys.value).join()) {
            signerKeys.value = bundle.value.uniqueSigners.reduce((curr, address) => {
                curr[address] = { input: '', wallet: null };
                return curr;
            }, {});
        }
    });
    blockInfo.subscribe(() => {
        if (provider.value && signers.value.burner) {
            provider.value.provider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance));
        }
    });
    function tryUpdateSigners(address, privateKey) {
        batch(() => {
            try {
                const wallet = new Wallet(privateKey);
                signerKeys.value = {
                    ...signerKeys.peek(),
                    [address]: {
                        wallet: wallet.address === address ? wallet : null,
                        input: privateKey,
                    },
                };
            }
            catch {
                signerKeys.value = {
                    ...signerKeys.peek(),
                    [address]: { wallet: null, input: privateKey },
                };
            }
            if (Object.values(signerKeys.value).filter(({ wallet }) => !wallet).length === 0) {
                signers.value = {
                    ...signers.peek(),
                    bundleSigners: Object.values(signerKeys.peek()).reduce((acc, wallet) => {
                        if (wallet.wallet) {
                            acc[wallet.wallet.address] = wallet.wallet;
                        }
                        return acc;
                    }, {}),
                };
            }
        });
    }
    return (_jsxs("div", { className: 'flex flex-col w-full gap-4', children: [_jsx("h3", { className: 'text-2xl font-semibold', children: "Enter Private Keys For Signing Accounts" }), Object.keys(signerKeys.value).map((address) => (_jsxs("div", { className: `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${signerKeys.value[address].wallet ? 'border-green-400' : (signerKeys.peek()[address].input ? 'border-red-400' : 'border-white/50 focus-within:border-white/80')}`, children: [_jsx("span", { className: 'text-sm text-gray-500', children: address }), _jsx("input", { onInput: (e) => tryUpdateSigners(address, e.currentTarget.value), value: signerKeys.value[address].input, type: 'text', className: 'bg-transparent outline-none placeholder:text-gray-600', placeholder: `Enter private key for account` })] })))] }));
};
//# sourceMappingURL=ConfigureKeys.js.map