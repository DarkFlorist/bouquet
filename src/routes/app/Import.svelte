<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import {
		bundleTransactions,
		interceptorPayload,
		isFundingTransaction,
		totalGas,
		totalValue,
		uniqueSigners,
		wallets,
	} from "$lib/state";
	import { slide } from "svelte/transition";
	import { circInOut } from "svelte/easing";
	import type { PayloadTransaction } from "$lib/types";
	import { BigNumber, Wallet } from "ethers";
	import type { FlashbotsBundleTransaction } from "@flashbots/ethers-provider-bundle";

	async function importFromInterceptor() {
		if (window.ethereum === undefined) return;
		// @ts-ignore
		await window.ethereum.request({ method: "eth_requestAccounts" });
		// @ts-ignore
		const { payload } = (await window.ethereum.request({
			method: "interceptor_getSimulationStack",
		})) as { payload: PayloadTransaction[] };

		const _uniqueSigners = [...new Set(payload.map((tx) => tx.from))];
		const _isFundingTransaction =
			payload.length >= 2 && _uniqueSigners.includes(payload[0].to);

		const _bundleTransactions = payload.map(
			({ from, to, value, input, gas }) => ({
				transaction: { from, to, value, data: input, gasLimit: gas },
			})
		) as FlashbotsBundleTransaction[];

		let fundingTarget: string;
		if (_isFundingTransaction) {
			if ($wallets.length === 0) {
				wallets.subscribe((x) => [...x, Wallet.createRandom()]);
			}
			fundingTarget = payload[0].to;
			_uniqueSigners.shift();
			_bundleTransactions.shift();
		}

		const _totalGas = _bundleTransactions.reduce(
			(sum, current) => sum.add(current.transaction.gasLimit ?? "0"),
			BigNumber.from(0)
		);

		// @TODO: Check this properly based on simulation +- on each transaction in step
		const _totalValue = _bundleTransactions
			.filter((tx) => tx.transaction.from === fundingTarget)
			.reduce(
				(sum, current) => sum.add(current.transaction.value ?? "0"),
				BigNumber.from(0)
			);

		localStorage.setItem("payload", JSON.stringify(payload));
		interceptorPayload.set(payload);

		uniqueSigners.set(_uniqueSigners);
		bundleTransactions.set(_bundleTransactions);
		isFundingTransaction.set(_isFundingTransaction);
		totalGas.set(_totalGas);
		totalValue.set(_totalValue);
	}
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
	<h2 class="font-extrabold text-3xl">Import Transaction Payload</h2>
	<div
		class="flex flex-col w-full gap-6"
		transition:slide={{ duration: 400, easing: circInOut }}
	>
		<Button onClick={importFromInterceptor}
			>Import Payload from TheInterceptor</Button
		>
	</div>
</article>
