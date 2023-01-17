<script lang="ts">
	import { activeSession, completedSession } from '$lib/state'
	import Configure from './Configure.svelte'
	import Import from './Import.svelte'
	import Submit from './Submit.svelte'

	let showConfig = !$completedSession
</script>

<div class="py-6 flex flex-col items-center justify-start w-full">
	{#if $activeSession}
		{#if showConfig}
			<Configure nextStage={() => (showConfig = false)} />
		{:else}
			<Submit />
		{/if}
	{:else}
		<Import />
	{/if}
</div>
