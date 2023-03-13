import { useState } from 'preact/hooks'
import { createProvider, sendBundle, simulate } from '../library/bundleUtils.js'
import { FlashbotsBundleProvider, FlashbotsBundleResolution, RelayResponseError, SimulationResponseSuccess } from '../library/flashbots-ethers-provider.js'
import { Button } from './Button.js'
import { ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { AppSettings, BlockInfo, BundleInfo, BundleState, PromiseState, Signers } from '../library/types.js'
import { ProviderStore } from '../library/provider.js'

const SimulationPromiseBlock = ({
  state,
}: {
  state:
  | {
    status: PromiseState
    value?: SimulationResponseSuccess
    error?: RelayResponseError
  }
  | undefined
}) => {
  if (!state) return <></>
  if (!state.value || state.status === 'pending') return <div>Simulating...</div>
  if (state.status === 'resolved')
    return (
      <div>
        {state.value.firstRevert ? (
          <h3 class='font-semibold text-error'>Simulation Reverted</h3>
        ) : (
          <h3 class='font-semibold text-success'>Simulation Succeeded</h3>
        )}
        {/* <p>Result: {JSON.stringify(state.value)}</p> */}
      </div>
    )
  if (state.status === 'rejected')
    return (
      <div>
        <p>Error Simulating: {state.error?.error.message}</p>
      </div>
    )
  return <></>
}

export const Bundles = ({
  pendingBundles,
  appSettings,
}: {
  pendingBundles: Signal<{ lastBlock: bigint; active: boolean; pendingBundles: BundleInfo[] }>
  appSettings: Signal<AppSettings>
}) => {
  return (
    <div class='flex flex-col-reverse gap-4'>
      {pendingBundles.value.pendingBundles.map((bundle, index) => (
        <div class='flex items-center font-semibold gap-2 text-white'>
          <p>Attempt {index + 1}:</p>
          {bundle.state === 'pending' ? (
            <span class='font-normal text-orange-400'>
              Trying to be included in block {(BigInt(bundle.details) + appSettings.peek().blocksInFuture).toString()}
            </span>
          ) : null}
          {bundle.state === 'rejected' ? <span class='font-normal text-error'>Error submitting bundle to node</span> : null}
          {bundle.details === 'BlockPassedWithoutInclusion' ? <span class='font-normal text-error'>Bundle was not included in target block</span> : null}
          {bundle.details === 'AccountNonceTooHigh' ? <span class='font-normal text-error'>Nonces in bundle already used</span> : null}
          {bundle.state === 'resolved' && bundle.details !== 'AccountNonceTooHigh' && bundle.details !== 'BlockPassedWithoutInclusion' ? (
            <span class='font-bold text-lg text-success'>Bundle Included!</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export const Submit = ({
  provider,
  interceptorPayload,
  fundingAmountMin,
  signers,
  appSettings,
  blockInfo,
}: {
  provider: Signal<ProviderStore | undefined>
  interceptorPayload: Signal<BundleState | undefined>
  signers: Signal<Signers>
  fundingAmountMin: ReadonlySignal<bigint>
  appSettings: Signal<AppSettings>
  blockInfo: Signal<BlockInfo>
}) => {
  const [simulationResult, setSimulationResult] = useState<
    | {
      status: 'pending' | 'resolved' | 'rejected'
      value?: SimulationResponseSuccess
      error?: RelayResponseError
    }
    | undefined
  >(undefined)

  const flashbotsProvider = useSignal<FlashbotsBundleProvider | undefined>(undefined)

  const bundleStatus = useSignal<{ lastBlock: bigint; active: boolean; pendingBundles: BundleInfo[] }>({
    active: false,
    lastBlock: blockInfo.peek().blockNumber,
    pendingBundles: [],
  })

  useSignalEffect(() => {
    blockInfo.value.blockNumber // trigger effect
    if (bundleStatus.peek().active && blockInfo.value.blockNumber > bundleStatus.peek().lastBlock) {
      bundleSubmission(blockInfo.value.blockNumber)
    }
  })

  const missingRequirements = useComputed(() => {
    if (!interceptorPayload.value) return 'No transactions imported yet.'
    const missingSigners = interceptorPayload.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length
    const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value
    if (missingSigners && insufficientBalance) return 'Missing private keys for signing accounts and funding wallet has insufficent balance.'
    if (missingSigners) return 'Missing private keys for signing accounts.'
    if (insufficientBalance) return 'Funding wallet has insufficent balance.'
    return false
  })

  async function ensureRelayProvider() {
    const relay = `https://corsproxy.io/?${appSettings.peek().relayEndpoint}`
    return flashbotsProvider.value && flashbotsProvider.value.connection.url === relay ? flashbotsProvider.value : await createProvider(provider, relay)
  }

  async function simulateBundle() {
    const relayProvider = await ensureRelayProvider()
    if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
    if (!provider.value) throw 'User not connected'
    if (!interceptorPayload.value) throw 'No imported bundle found'
    setSimulationResult({ status: 'pending' })
    simulate(
      relayProvider,
      provider.value.provider,
      blockInfo.peek(),
      appSettings.peek().blocksInFuture,
      interceptorPayload.value,
      signers.peek(),
      fundingAmountMin.peek(),
    )
      .then((value) => {
        if ((value as RelayResponseError).error) setSimulationResult({ status: 'rejected', error: value as RelayResponseError })
        else setSimulationResult({ status: 'resolved', value: value as SimulationResponseSuccess })
      })
      .catch((err) => setSimulationResult({ status: 'rejected', error: { error: { code: 0, message: `Unhandled Error: ${err}` } } }))
  }

  async function bundleSubmission(blockNumber: bigint) {
    const relay = `https://corsproxy.io/?${appSettings.peek().relayEndpoint}`
    const relayProvider = flashbotsProvider.value ?? (await createProvider(provider, relay))
    if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
    if (!provider.value) throw 'User not connected'
    if (!interceptorPayload.value) throw 'No imported bundle found'

    const bundleSubmission = await sendBundle(
      relayProvider,
      provider.value.provider,
      { ...blockInfo.peek(), blockNumber },
      appSettings.peek().blocksInFuture,
      interceptorPayload.value,
      signers.peek(),
      fundingAmountMin.peek(),
    ).catch(() => {
      bundleStatus.value = {
        active: bundleStatus.value.active,
        lastBlock: blockNumber,
        pendingBundles: [...bundleStatus.value.pendingBundles, { hash: '', state: 'rejected', details: `RPC Error: ${blockNumber.toString()}` }],
      }
    })

    if (bundleSubmission) {
      bundleStatus.value = {
        active: bundleStatus.value.active,
        lastBlock: blockNumber,
        pendingBundles: [...bundleStatus.value.pendingBundles, { hash: bundleSubmission.bundleHash, state: 'pending', details: blockNumber.toString() }],
      }

      const status = await bundleSubmission.wait()
      console.log(`Status for ${bundleSubmission.bundleHash}: ${FlashbotsBundleResolution[status]}`)

      if (status === FlashbotsBundleResolution.BundleIncluded) {
        const pendingBundles = bundleStatus.value.pendingBundles
        const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
        pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `Bundle Included` }
        bundleStatus.value = { ...bundleStatus.value, active: false, pendingBundles }
      } else {
        const pendingBundles = bundleStatus.value.pendingBundles
        const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
        pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `${FlashbotsBundleResolution[status]}` }
        bundleStatus.value = { ...bundleStatus.value, pendingBundles }
      }
    }
  }

  async function toggleSubmission() {
    if (!bundleStatus.peek().active) {
      const relay = `https://corsproxy.io/?${appSettings.peek().relayEndpoint}`
      const relayProvider = flashbotsProvider.value ?? (await createProvider(provider, relay))
      if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
      if (!provider.value) throw 'User not connected'
      if (!interceptorPayload.value) throw 'No imported bundle found'
      bundleStatus.value = {
        active: true,
        lastBlock: bundleStatus.value.lastBlock,
        pendingBundles: bundleStatus.value.pendingBundles.filter((x) => x.state === 'pending'),
      }
      bundleSubmission(blockInfo.value.blockNumber)
    } else {
      bundleStatus.value = { ...bundleStatus.value, active: false }
    }
  }

  return (
    <>
      <h2 className='font-bold text-2xl'>3. Submit</h2>
      {missingRequirements.value ? (
        <p>{missingRequirements.peek()}</p>
      ) : (
        <div className='flex flex-col w-full gap-6'>
          <Button onClick={simulateBundle} variant='secondary'>
            Simulate
          </Button>
          <SimulationPromiseBlock state={simulationResult} />
          <Button onClick={toggleSubmission}>{bundleStatus.value.active ? 'Stop' : 'Submit'}</Button>
          <Bundles pendingBundles={bundleStatus} appSettings={appSettings} />
        </div>
      )}
    </>
  )
}
