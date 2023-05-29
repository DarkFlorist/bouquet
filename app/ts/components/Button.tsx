import { JSX } from "preact/jsx-runtime"

const classNames = {
	primary: 'flex items-center justify-center gap-1 font-semibold rounded-xl px-6 py-2 w-max bg-accent text-background hover:bg-accent/80 disabled:bg-slate-600 disabled:cursor-not-allowed',
	secondary: 'flex items-center justify-center gap-1 font-semibold rounded-xl px-6 py-2 w-max bg-white text-background hover:bg-white/80 disabled:bg-slate-600 disabled:cursor-not-allowed',
}

export const Button = ({
	children,
	disabled,
	variant,
	onClick,
}: {
	children: string | JSX.Element
	disabled?: boolean
	variant?: 'primary' | 'secondary'
	onClick: () => unknown
}) => {
	return (
		<button onClick={onClick} disabled={disabled ?? false} className={classNames[variant ?? 'primary']}>
			{children}
		</button>
	)
}
