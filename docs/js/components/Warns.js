import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
export const SingleNotice = ({ variant, title, description }) => {
    const variantColors = {
        warn: 'border-orange-400/50 bg-orange-400/10',
        error: 'border-red-400/50 bg-red-400/10',
        success: 'border-green-400/50 bg-green-400/10'
    };
    const variantEmoji = {
        warn: '⚠',
        error: '🛑',
        success: '🎉'
    };
    return (_jsxs("div", { class: `flex items-center items-center border ${variantColors[variant]} px-4 py-2 gap-4`, children: [_jsx("span", { class: 'text-2xl', children: variantEmoji[variant] }), _jsxs("div", { class: 'py-3 flex-grow', children: [_jsx("h3", { class: 'font-lg font-semibold', children: title }), description ? (_jsx("div", { class: 'leading-tight text-white/75 break-word text-sm', children: description })) : null] })] }));
};
//# sourceMappingURL=Warns.js.map