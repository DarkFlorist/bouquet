<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import {
		bundleContainsFundingTx,
		uniqueSigners,
		wallet,
		fundingAccountBalance,
		signingAccounts,
		fundingAmountMin,
	} from '$lib/state'
	import { Wallet, utils } from 'ethers'
	import { circInOut } from 'svelte/easing'
	import { slide } from 'svelte/transition'

	export let nextStage: () => void

	const signerKeys: {
		[address: string]: { input: string; wallet: Wallet | null }
	} = $uniqueSigners.reduce(
		(
			curr: {
				[address: string]: { input: string; wallet: Wallet | null }
			},
			address,
		) => {
			curr[utils.getAddress(address)] = { input: '', wallet: null }
			return curr
		},
		{},
	)

	$: requirementsMet =
		Object.values(signerKeys).filter(({ wallet }) => !wallet).length === 0 &&
		$fundingAccountBalance >= $fundingAmountMin

	const saveAndNext = () => {
		signingAccounts.set(
			Object.values(signerKeys).reduce(
				(acc: { [account: string]: Wallet }, wallet) => {
					if (wallet.wallet) {
						acc[wallet.wallet.address] = wallet.wallet
					}
					return acc
				},
				{},
			),
		)
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
				}}
				class={`p-3 bg-secondary text-white ring ring-offset-2 ${
					signerKeys[address].wallet ? 'ring-success' : 'ring-error'
				}`}
				type='text'
				placeholder={`Private key for ${address}`}
			/>
		{/each}
		{#if $bundleContainsFundingTx && $wallet}
			<h3 class="text-2xl font-semibold">Deposit To Funding Account</h3>
			<span>{$wallet.address}</span>
			<span
				>Wallet Balance: {utils.formatEther($fundingAccountBalance)} ETH / Needed:
				{utils.formatEther($fundingAmountMin)} ETH</span
			>
		{/if}
		<Button disabled={!requirementsMet} onClick={saveAndNext}>Next</Button>
	</div>
</article>
