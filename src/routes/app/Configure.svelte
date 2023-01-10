<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import {
		bundleTransactions,
		interceptorPayload,
		isFundingTransaction,
		uniqueSigners,
		wallets,
	} from "$lib/state";
	import { Wallet } from "ethers";
	import { getAddress } from "ethers/lib/utils";
	import { circInOut } from "svelte/easing";
	import { slide } from "svelte/transition";

	export let nextStage: () => void;

	let _signerKeys: {
		[address: string]: { input: string; wallet: Wallet | null };
	} = $uniqueSigners.reduce(
		(
			curr: {
				[address: string]: { input: string; wallet: Wallet | null };
			},
			address
		) => {
			curr[address] = { input: "", wallet: null };
			return curr;
		},
		{}
	);

	const saveAndNext = () => {
		bundleTransactions.update(($bundleTransactions) => {
			for (let tx in $bundleTransactions) {
				const signer = _signerKeys[$bundleTransactions[tx].transaction.from]
					.wallet as Wallet;
				$bundleTransactions[tx].signer = signer;
			}
			nextStage();
			if ($isFundingTransaction) {
				return [
					{
						signer: $wallets[$wallets.length - 1],
						transaction: {
							from: $wallets[$wallets.length - 1].address,
							to: $interceptorPayload[0].to,
							// @TODO: Replace value with required amount for funding based of gas prices
							value: "0x8E1BC9BF040000",
							data: "0x",
							gasLimit: "0x5208",
						},
					},
					...$bundleTransactions,
				];
			} else {
				return $bundleTransactions;
			}
		});
	};

	// Watch ETH balance
	// block number
	// base and priority gas
	// derivie deposit amount
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
	<h2 class="font-extrabold text-3xl">Configure Bundle</h2>
	<div
		class="flex flex-col w-full gap-6"
		transition:slide={{ duration: 400, easing: circInOut }}
	>
		<h3 class="text-2xl font-semibold">
			Found {$uniqueSigners.length} Signers {$isFundingTransaction
				? " + A Funding Transaction"
				: ""}
		</h3>
		{#each $uniqueSigners as address}
			<span class="font-semibold -mb-4">{address}</span>
			<input
				bind:value={_signerKeys[address].input}
				on:change={() => {
					// Check pk is valid
					try {
						const wallet = new Wallet(_signerKeys[address].input);
						_signerKeys[address].wallet =
							wallet.address === getAddress(address) ? wallet : null;
					} catch {
						_signerKeys[address].wallet = null;
					}
					_signerKeys = _signerKeys;
				}}
				class={`p-3 bg-secondary text-white ring ring-offset-2 ${
					_signerKeys[address].wallet ? "ring-success" : "ring-error"
				}`}
				type="text"
				placeholder={`Private key for ${address}`}
			/>
		{/each}
		<h3 class="text-2xl font-semibold">Deposit To Funding Account</h3>
		<span>{$wallets[$wallets.length - 1].address}</span>
		<!-- <p>Unused Ether sent to funding account will be returned</p> -->
		<!-- <input -->
		<!-- 	class={`p-3 bg-secondary text-white ring ring-offset-2 ${ -->
		<!-- 		isAddress(refundAddress) ? "ring-success" : "ring-error" -->
		<!-- 	type="text" -->
		<!-- 	bind:value={refundAddress} -->
		<!-- 	placeholder="Refund address" -->
		<!-- /> -->
		<Button onClick={saveAndNext}>Next</Button>
	</div>
</article>
