/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				background: '#16161D',
				primary: '#FFFFFC',
				secondary: '#757780',
				accent: '#6CCFF6',
				success: '#98CE00',
				error: '#DB5461',
			},
			fontFamily: {
				serif: ['Poppins', 'sans-serif'],
			},
		},
	},
	plugins: [],
}
