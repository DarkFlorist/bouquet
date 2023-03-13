import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "preact/jsx-runtime";
import { batch, useSignal } from '@preact/signals';
import { Wallet, utils } from 'ethers';
export const Configure = ({ provider, interceptorPayload, fundingAmountMin, signers, blockInfo, }) => {
    const signerKeys = useSignal({});
    if (interceptorPayload.peek() && Object.keys(signerKeys.peek()).length === 0) {
        signerKeys.value =
            interceptorPayload.value && Object.keys(signerKeys.peek()).length === 0
                ? interceptorPayload.value.uniqueSigners.reduce((curr, address) => {
                    curr[utils.getAddress(address)] = { input: '', wallet: null };
                    return curr;
                }, {})
                : {};
    }
    blockInfo.subscribe(() => {
        if (provider.value && signers.value.burner) {
            provider.value.provider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance.toBigInt()));
        }
    });
    function tryUpdateSigners(address, privateKey) {
        batch(() => {
            try {
                const wallet = new Wallet(privateKey);
                signerKeys.value = {
                    ...signerKeys.peek(),
                    [address]: {
                        wallet: wallet.address === utils.getAddress(address) ? wallet : null,
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
    function copyBurnerToClipboard() {
        if (!signers.value.burner)
            return;
        navigator.clipboard.writeText(signers.value.burner.address);
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { className: 'font-bold text-2xl', children: "2. Configure" }), interceptorPayload.value ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: 'flex flex-col w-full gap-4', children: [_jsx("h3", { className: 'text-2xl font-semibold', children: "Enter Private Keys For Signing Accounts" }), interceptorPayload.value.uniqueSigners.map((address) => (_jsxs(_Fragment, { children: [_jsx("span", { className: 'font-semibold -mb-2', children: address }), _jsx("input", { type: 'text', value: signerKeys.value[address].input, onKeyUp: (e) => tryUpdateSigners(address, e.currentTarget.value), className: `p-4 text-lg rounded-xl border-slate-200/70 border-2 ${signerKeys.value[address].wallet ? 'bg-success/10' : signerKeys.peek()[address].input ? 'bg-error/10' : 'bg-background'}`, placeholder: `Private key for ${address}` })] })))] }), interceptorPayload.value?.containsFundingTx && signers.value.burner ? (_jsxs("div", { className: 'flex flex-col w-full gap-4', children: [_jsx("h3", { className: 'text-2xl font-semibold', children: "Deposit To Funding Account" }), _jsxs("span", { className: 'p-4 flex items-center gap-4 w-max rounded-xl text-lg bg-white text-background font-bold font-mono', children: [signers.value.burner.address, _jsx("button", { onClick: copyBurnerToClipboard, className: 'active:text-background/70', children: _jsx("svg", { className: 'h-8 inline-block', "aria-hidden": 'true', fill: 'none', stroke: 'currentColor', "stroke-width": '1.5', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', children: _jsx("path", { d: 'M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6', "stroke-linecap": 'round', "stroke-linejoin": 'round' }) }) })] }), _jsxs("p", { className: 'font-semibold text-lg', children: ["Wallet Balance: ", _jsx("span", { className: 'font-medium font-mono', children: utils.formatEther(signers.value.burnerBalance) }), " ETH", _jsx("br", {}), "Minimum Required Balance: ", _jsx("span", { className: 'font-medium font-mono', children: utils.formatEther(fundingAmountMin.value) }), " ETH"] })] })) : ('')] })) : (_jsx("p", { children: "No transactions imported yet." }))] }));
};
//# sourceMappingURL=Configure.js.map