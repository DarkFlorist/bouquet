<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import { circInOut } from "svelte/easing";
  import { slide } from "svelte/transition";
  export let active: boolean = false;
  export let nextStage: () => void;

  let complete: boolean = false;
</script>

<article class="p-6 max-w-screen-lg w-full flex flex-col gap-6">
  <h2
    class={`font-extrabold ${
      !active ? (complete ? "text-success" : "text-secondary") : ""
    } text-3xl`}
  >
    Review And Submit
  </h2>

  {#if active}
    <div
      class="flex flex-col w-full gap-6"
      transition:slide={{ duration: 400, easing: circInOut }}
    >
      <h3 class="text-xl">// @TODO: this section</h3>
      <Button onClick={nextStage}>Submit 🚀</Button>
    </div>
  {/if}
</article>
