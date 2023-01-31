const classNames = {
	primary: 'text-xl font-semibold border-2 rounded-md px-6 py-2 border-accent text-accent hover:bg-accent/20 active:text-primary active:bg-accent/40 disabled:border-secondary disabled:bg-secondary/30 active:disabled:text-accent',
	success: 'text-xl font-semibold border-2 rounded-md px-6 py-2 border-success text-success hover:bg-success/20 active:text-primary active:bg-success/40 disabled:border-secondary disabled:bg-secondary/30 active:disabled:text-success',
	error: 'text-xl font-semibold border-2 rounded-md px-6 py-2 border-error text-error hover:bg-error/20 active:text-primary active:bg-error/40 disabled:border-secondary disabled:bg-secondary/30 active:disabled:text-error',
}

export const Button = ({ children, disabled, variant, onClick }: { children: string; disabled?: boolean; variant?: 'primary' | 'success' | 'error'; onClick: () => any }) => {
	return (
		<button onClick={onClick} disabled={disabled ?? false} className={classNames[variant ?? 'primary']}>
			{children}
		</button>
	)
}
