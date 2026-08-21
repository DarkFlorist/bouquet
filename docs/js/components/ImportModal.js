import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { useComputed, useSignal } from '@preact/signals';
import { createBundle } from '../library/bundle.js';
import { TransactionList } from '../types/bouquetTypes.js';
import { Button } from './Button.js';
const placeholder = `[
  {
    "from": "0xb3cd36cfaa07652dbfecca76f438ff8998a4f539",
    "to": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    "value": "0x16345785d8a0000",
    "input": "0xd0e30db0",
    "chainId": "0x1",
    "gasLimit": "0x15f90"
  },
  {
    "from": "0xb3cd36cfaa07652dbfecca76f438ff8998a4f539",
    "to": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    "value": "0x0",
    "input": "0x2e1a7d4d000000000000000000000000000000000000000000000000016345785d8a0000",
    "chainId": "0x1",
    "gasLimit": "0x15f90"
  }
]`;
export const ImportModal = ({ display, bundle, clearError }) => {
    const jsonInput = useSignal('');
    const isValid = useComputed(() => {
        if (!jsonInput.value)
            return false;
        try {
            const { success } = TransactionList.safeParse(JSON.parse(jsonInput.value));
            return success;
        }
        catch {
            return false;
        }
    });
    function importJson() {
        if (!isValid.peek())
            return;
        const txList = TransactionList.parse(JSON.parse(jsonInput.value));
        const importedBundle = createBundle(txList);
        localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(importedBundle.transactions)));
        bundle.value = importedBundle;
        clearError();
        close();
    }
    function close() {
        jsonInput.value = '';
        display.value = false;
    }
    return display.value ? (_jsx("div", { onClick: close, className: 'bg-white/10 w-full h-full inset-0 fixed p-4 flex flex-col items-center md:pt-24', children: _jsxs("div", { class: 'h-max px-8 py-4 flex flex-col gap-4 bg-black', onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: 'text-xl font-semibold', children: "Import Transactions From JSON" }), _jsx("div", { children: _jsx("textarea", { placeholder: placeholder, onInput: (e) => jsonInput.value = e.currentTarget.value, value: jsonInput.value, type: 'url', className: `p-2 w-96 h-96 border ${jsonInput.value && isValid.value ? 'border-green-400 bg-green-200/10' : jsonInput.value && !isValid.value ? 'border-red-400 bg-red-200/10' : 'border-white/50 focus-within:border-white/90 bg-transparent focus-within:bg-white/5'} outline-none px-4` }) }), _jsx("div", { className: 'flex gap-2', children: _jsx(Button, { onClick: importJson, disabled: !isValid.value, variant: 'primary', children: "Import" }) })] }) })) : null;
};
//# sourceMappingURL=ImportModal.js.map