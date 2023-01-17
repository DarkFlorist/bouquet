<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import {
		bundleTransactions,
		interceptorPayload,
		bundleContainsFundingTx,
		totalGas,
		totalValue,
		uniqueSigners,
		wallets,
	} from '$lib/state'
	import { slide } from 'svelte/transition'
	import { circInOut } from 'svelte/easing'
	import type { PayloadTransaction } from '$lib/types'
	import { Wallet } from 'ethers'
	import type { FlashbotsBundleTransaction } from '@flashbots/ethers-provider-bundle'

	async function importFromInterceptor() {
		if (window.ethereum === undefined) return
		// @ts-ignore
		await window.ethereum.request({ method: 'eth_requestAccounts' })
		// @ts-ignore
		const { payload } = (await window.ethereum.request({
			method: 'interceptor_getSimulationStack',
		})) as { payload: PayloadTransaction[] }

		console.log({ payload })

		const uniqueSigningAccounts = [...new Set(payload.map((tx) => tx.from))]
		const isFundingTransaction =
			payload.length >= 2 && uniqueSigningAccounts.includes(payload[0].to)

		const transactions = payload.map(
			({ from, to, value, input, gas }) => ({
				transaction: { from, to, value, data: input, gasLimit: gas },
			})
		) as FlashbotsBundleTransaction[]

		let fundingTarget: string
		if (isFundingTransaction) {
			if ($wallets.length === 0) {
				wallets.subscribe((x) => [...x, Wallet.createRandom()])
			}
			fundingTarget = payload[0].to
			uniqueSigningAccounts.shift()
			transactions.shift()
		}

		totalGas.set(transactions.reduce(
			(sum, current) => sum + BigInt(current?.transaction.gasLimit?.toString() ?? 0n),
			0n
		))

		// @TODO: Check this properly based on simulation +- on each transaction in step
		totalValue.set(transactions
			.filter((tx) => tx.transaction.from === fundingTarget)
			.reduce(
				(sum, current) => sum + BigInt(current.transaction.value?.toString() ?? 0n),
        0n
			)
    )

		localStorage.setItem('payload', JSON.stringify(payload))
		interceptorPayload.set(payload)

		uniqueSigners.set(uniqueSigningAccounts)
		bundleTransactions.set(transactions)
		bundleContainsFundingTx.set(isFundingTransaction)
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
