<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import { slide } from 'svelte/transition'
	import { circInOut } from 'svelte/easing'
	import { importFromInterceptor } from '$lib/import'

	let importRequest: Promise<String | undefined> | null = null
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
	<h2 class="font-extrabold text-3xl">Import Transaction Payload</h2>
	<div
		class="flex flex-col w-full gap-6"
		transition:slide={{ duration: 400, easing: circInOut }}
	>
		<Button onClick={() => (importRequest = importFromInterceptor())}
			>Import Payload from TheInterceptor</Button
		>
		{#await importRequest then error}
			{#if error}
				<span>{error}</span>
				{#if error === 'Import Error: Wallet does not support returning simulations'}
					<h3 class="text-xl">
						Don't have TheInterceptor Installed? Install it here <a
							class="font-bold hover:underline"
							href="https://dark.florist">here</a
						>.
					</h3>
				{/if}
			{/if}
		{/await}
	</div>
</article>
