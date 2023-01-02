<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import { isImportPayload, type ImportPayload } from "$lib/types";
  import { payload } from "$lib/state";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { circInOut } from "svelte/easing";

  export let active: boolean = false;
  export let complete: boolean = true;
  export let setActive: () => void;
  export let nextStage: () => void;

  let payloadInput = "";
  $: validPayload = isValidPayload(payloadInput);

  function isValidPayload(payload: string) {
    try {
      const parsed = JSON.parse(payload);
      if (isImportPayload(parsed)) {
        payloadInput = JSON.stringify(parsed, null, 2);
        return true;
      } else return false;
    } catch {
      return false;
    }
  }

  function setPayload() {
    payload.set(JSON.parse(payloadInput));
    localStorage.setItem("payload", JSON.stringify($payload));
    nextStage();
  }

  async function importFromIntercepter() {
    // @ts-ignore
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const data: ImportPayload = {
      // @ts-ignore
      transactions: await window.ethereum.request({
        method: "interceptor_getSimulatedUnsignedTransactions_v1",
      }),
    };
    if (data.transactions.length > 0)
      payloadInput = JSON.stringify(data, null, 2);
  }

  onMount(() => {
    if ($payload) payloadInput = JSON.stringify($payload, null, 2);
  });
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
  {#if complete}
    <button
      on:click={setActive}
      class="w-max font-extrabold text-success text-3xl cursor-pointer"
    >
      Import Transaction Payload
    </button>
  {:else}
    <h2 class={`font-extrabold ${!active ? "text-secondary" : ""} text-3xl`}>
      Import Transaction Payload
    </h2>
  {/if}

  {#if active}
    <div
      class="flex flex-col w-full gap-6"
      transition:slide={{ duration: 400, easing: circInOut }}
    >
      <textarea
        bind:value={payloadInput}
        class="w-full h-36 p-4 bg-secondary placeholder:text-primary/70"
        placeholder="Paste Payload Here"
      />
      <Button onClick={importFromIntercepter}
        >Import Payload from TheIntercepter</Button
      >
      {#if payloadInput && validPayload}
        <Button onClick={setPayload}>Next</Button>
      {:else if payloadInput && !validPayload}
        <Button disabled={true} variant="error">Invalid Payload Format</Button>
      {:else}
        <Button disabled={true}>Missing Payload</Button>
      {/if}
    </div>
  {/if}
</article>
