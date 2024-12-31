import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { Import } from './Import.js';
import { Submit } from './Submit.js';
import { Button } from './Button.js';
import { Transactions } from './Transactions.js';
import { connectBrowserProvider } from '../library/provider.js';
import { Navbar } from './Navbar.js';
import { createGlobalState } from '../stores.js';
import { Footer } from './Footer.js';
import { ConfigureKeys } from './ConfigureKeys.js';
import { ConfigureFunding } from './ConfigureFunding.js';
export function App() {
    const state = createGlobalState();
    return (_jsxs("main", { class: 'bg-black text-primary w-screen max-w-screen overflow-hidden min-h-screen sm:p-4 p-6 gap-4 font-serif flex flex-col items-center max-w-screen-xl', children: [_jsx(Navbar, { ...state }), _jsx("div", { className: 'p-4 mt-4 flex flex-col gap-8 w-full', children: !state.provider.value && state.bundle.value ? (_jsxs("article", { className: 'items-center flex flex-col gap-4 py-8', children: [_jsx("h2", { class: 'text-2xl font-bold', children: "Welcome Back" }), _jsx(Button, { onClick: () => connectBrowserProvider(state.provider, state.blockInfo, state.bundle.peek()?.containsFundingTx ? state.signers : undefined, state.bouquetSettings), children: "Connect Wallet" })] })) : (_jsxs(_Fragment, { children: [_jsx(Import, { ...state }), state.bundle.value ? _jsx(Transactions, { ...state }) : null, _jsxs("h2", { className: 'font-bold text-2xl', children: [_jsx("span", { class: 'text-gray-500', children: "2." }), " Configure"] }), state.bundle.value ? (_jsxs(_Fragment, { children: [_jsx(ConfigureKeys, { ...state }), _jsx(ConfigureFunding, { ...state })] })) : _jsx("p", { children: "No transactions imported yet." }), _jsx(Submit, { ...state })] })) }), _jsx(Footer, {})] }));
}
//# sourceMappingURL=App.js.map