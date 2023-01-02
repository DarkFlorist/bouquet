<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import { payload } from "$lib/state";
  import { circInOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  export let active: boolean;
  export let complete: boolean;
  export let setActive: () => void;
  export let nextStage: () => void;
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
  {#if complete}
    <button
      on:click={setActive}
      class="w-max font-extrabold text-success text-3xl cursor-pointer"
    >
      Configure Bundle
    </button>
  {:else}
    <h2 class={`font-extrabold ${!active ? "text-secondary" : ""} text-3xl`}>
      Configure Bundle
    </h2>
  {/if}

  {#if active}
    <div
      class="flex flex-col w-full gap-6"
      transition:slide={{ duration: 400, easing: circInOut }}
    >
      <h3 class="text-xl">// @TODO: this section</h3>
      <div class="flex-col flex gap-4">
        {#each $payload ? $payload.transactions : [] as tx, index}
          <ul class="rounded bg-secondary p-4">
            <li>#{index}</li>
            <li>From: {tx.from}</li>
            <li>To: {tx.to}</li>
            <li>Value: {tx.value}</li>
            <li class="w-full break-all">Input: {tx.input}</li>
          </ul>
        {/each}
      </div>
      <Button onClick={nextStage}>Next</Button>
    </div>
  {/if}
</article>
