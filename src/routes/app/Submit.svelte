<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import { circInOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import { createProvider, sendBundle, simulate } from "$lib/bundleUtils";
	import type {
		FlashbotsBundleProvider,
		SimulationResponse,
	} from "@flashbots/ethers-provider-bundle";
	import { bundleTransactions } from "$lib/state";

	let flasbotsProvider: FlashbotsBundleProvider;
	let simulationResultPromise: Promise<SimulationResponse>;

	async function simulateBundle() {
		if (!flasbotsProvider) {
			flasbotsProvider = await createProvider();
		}
		simulationResultPromise = simulate(flasbotsProvider);
	}

	async function submitBundle() {
		if (!flasbotsProvider) {
			flasbotsProvider = await createProvider();
		}
		sendBundle(flasbotsProvider);
	}
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
	<h2
		class="font-extrabold
		 text-3xl"
	>
		Review And Submit
	</h2>

	<div
		class="flex flex-col w-full gap-6"
		transition:slide={{ duration: 400, easing: circInOut }}
	>
		<h3 class="text-xl">// @TODO: this section</h3>
		<div class="flex-col flex gap-4">
			{#each $bundleTransactions as tx, index}
				<ul class="rounded bg-secondary p-4">
					<li>#{index}</li>
					<li>From: {tx.transaction.from}</li>
					<li>To: {tx.transaction.to}</li>
					<li>Value: {tx.transaction.value}</li>
					<li class="w-full break-all">Input: {tx.transaction.data}</li>
				</ul>
			{/each}
		</div>
		<Button onClick={simulateBundle}>Simulate</Button>
		{#await simulationResultPromise}
			Waiting for simulation to complete...
		{:then result}
			{#if result}
				<p>Simulate Result:</p>
				<span>{JSON.stringify(result, null, 2)}</span>
			{/if}
		{:catch error}
			<p>Simulate Promise Rejected:</p>
			<span>{JSON.stringify(error, null, 2)}</span>
		{/await}
		<Button onClick={submitBundle}>Submit</Button>
	</div>
</article>
