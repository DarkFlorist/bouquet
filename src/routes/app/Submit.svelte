<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import { circInOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import { onMount } from "svelte";
	import { createProvider, simulate } from "$lib/bundleUtils";
	import type { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
	import { bundleTransactions, uniqueSigners } from "$lib/state";

	let flasbotsProvider: FlashbotsBundleProvider;
	onMount(() => createProvider().then((p) => (flasbotsProvider = p)));

	async function callBundle() {
		if (flasbotsProvider) {
			simulate(flasbotsProvider);
			// 	const tmpProvider = new providers.JsonRpcProvider(
			// 		"https://eth-mainnet.g.alchemy.com/v2/uDMIINAXEziTg9vsUyMwyEeyak1z_RUh"
			// 	);
			// 	const txs = $payload.transactions;
			// 	const tmp = Wallet.createRandom();
			// 	console.log(txs);
			// 	const signed = await flasbotsProvider.signBundle(
			// 		txs.map(({ to, value }) => ({
			// 			signer: tmp.connect(tmpProvider),
			// 			transaction: { from: tmp.address, to, value },
			// 		}))
			// 	);
			// 	const block = await flasbotsProvider.getBlockNumber();
			// 	const x = await flasbotsProvider.simulate(signed, block + 1);
			// 	console.log(x);
		}
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
		<h3 class="text-xl">{JSON.stringify($uniqueSigners)}</h3>
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
		<Button onClick={callBundle}>Submit 🚀</Button>
	</div>
</article>
