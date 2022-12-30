<script lang="ts">
  import Button from "$lib/components/Button.svelte";
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
      <Button onClick={nextStage}>Next</Button>
    </div>
  {/if}
</article>
