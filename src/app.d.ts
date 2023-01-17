// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import { providers } from 'ethers'

// and what to do when importing types
declare namespace App {
	// interface Error {}
	// interface Locals {}
	// interface PageData {}
	// interface Platform {}
}

declare global {
	interface Window {
		ethereum: providers.ExternalProvider
	}
}
