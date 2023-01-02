<script lang="ts">
  import { activeSession } from "$lib/state";
  import { onMount } from "svelte";
  import Configure from "./Configure.svelte";
  import Fund from "./Fund.svelte";
  import Import from "./Import.svelte";
  import Submit from "./Submit.svelte";

  let activePanel = 1;

  onMount(() => {
    if ($activeSession) activePanel = 2;
  });
</script>

<div class="py-6 flex flex-col items-center justify-start w-full">
  <Import
    nextStage={() => (activePanel = 2)}
    setActive={() => (activePanel = 1)}
    active={activePanel === 1}
    complete={activePanel > 1}
  />
  <!-- 2. Configure 3. Fund 4. Submit -->
  <Configure
    nextStage={() => (activePanel = 3)}
    setActive={() => (activePanel = 2)}
    active={activePanel === 2}
    complete={activePanel > 2}
  />
  <Fund
    nextStage={() => (activePanel = 4)}
    setActive={() => (activePanel = 3)}
    active={activePanel === 3}
    complete={activePanel > 3}
  />
  <Submit nextStage={() => (activePanel = 1)} active={activePanel === 4} />
</div>
