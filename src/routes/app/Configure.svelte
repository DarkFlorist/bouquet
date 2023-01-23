<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import { targetFundingBalance } from '$lib/configure'
	import {
		bundleTransactions,
		bundleContainsFundingTx,
		uniqueSigners,
		wallets,
		fundingAccountBalance,
	} from '$lib/state'
	import { Wallet, utils } from 'ethers'
	import { circInOut } from 'svelte/easing'
	import { slide } from 'svelte/transition'

	export let nextStage: () => void

	let signerKeys: {
		[address: string]: { input: string; wallet: Wallet | null }
	} = $uniqueSigners.reduce(
		(
			curr: {
				[address: string]: { input: string; wallet: Wallet | null }
			},
			address,
		) => {
			curr[address] = { input: '', wallet: null }
			return curr
		},
		{},
	)

	$: requirementsMet =
		Object.values(signerKeys).filter(({ wallet }) => !wallet).length === 0 &&
		$fundingAccountBalance >= $targetFundingBalance

	const saveAndNext = () => {
		bundleTransactions.update(($bundleTransactions) => {
			for (let tx in $bundleTransactions) {
				const signer = signerKeys[
					$bundleTransactions[tx].transaction.from as string
				].wallet as Wallet
				$bundleTransactions[tx].signer = signer
			}
			return $bundleTransactions
		})
		nextStage()
	}
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
	<h2 class="font-extrabold text-3xl">Configure Bundle</h2>
	<div
		class="flex flex-col w-full gap-6"
		transition:slide={{ duration: 400, easing: circInOut }}
	>
		<h3 class="text-2xl font-semibold">
			Found {$uniqueSigners.length} Signers {$bundleContainsFundingTx
				? ' + A Funding Transaction'
				: ''}
		</h3>
		{#each $uniqueSigners as address}
			<span class="font-semibold -mb-4">{address}</span>
			<input
				bind:value={signerKeys[address].input}
				on:change={() => {
					// Check pk is valid
					try {
						const wallet = new Wallet(signerKeys[address].input)
						signerKeys[address].wallet =
							wallet.address === utils.getAddress(address) ? wallet : null
					} catch {
						signerKeys[address].wallet = null
					}
					signerKeys = signerKeys
				}}
				class={`p-3 bg-secondary text-white ring ring-offset-2 ${
					signerKeys[address].wallet ? 'ring-success' : 'ring-error'
				}`}
				type="text"
				placeholder={`Private key for ${address}`}
			/>
		{/each}
		{#if $bundleContainsFundingTx}
			<h3 class="text-2xl font-semibold">Deposit To Funding Account</h3>
			<span>{$wallets[$wallets.length - 1].address}</span>
			<span
				>Wallet Balance: {utils.formatEther($fundingAccountBalance)} ETH / Needed:
				{utils.formatEther($targetFundingBalance)} ETH</span
			>
		{/if}
		<Button disabled={!requirementsMet} onClick={saveAndNext}>Next</Button>
	</div>
</article>
