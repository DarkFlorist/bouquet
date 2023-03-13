import { jsx as _jsx } from "preact/jsx-runtime";
const classNames = {
    primary: 'font-semibold rounded-xl px-6 py-2 w-max bg-accent text-background hover:bg-accent/80 disabled:bg-slate-600 disabled:cursor-not-allowed',
    secondary: 'font-semibold rounded-xl px-6 py-2 w-max bg-white text-background hover:bg-white/80 disabled:bg-slate-600 disabled:cursor-not-allowed',
};
export const Button = ({ children, disabled, variant, onClick, }) => {
    return (_jsx("button", { onClick: onClick, disabled: disabled ?? false, className: classNames[variant ?? 'primary'], children: children }));
};
//# sourceMappingURL=Button.js.map