<script>
  let { segments = [] } = $props();
</script>

{#each segments as segment}
  {#if segment.type === "code"}
    <code
      class="rounded-md bg-[#f1f3fb] px-1.5 py-0.5 font-[Cascadia_Code,Consolas,monospace] text-[0.92em] dark:bg-[#24283a]"
    >
      {segment.text}
    </code>
  {:else if segment.type === "strong"}
    <strong class="font-semibold text-slate-950 dark:text-slate-50"
      >{segment.text}</strong
    >
  {:else if segment.type === "em"}
    <em class="italic text-slate-700 dark:text-slate-200">{segment.text}</em>
  {:else}
    {segment.text}
  {/if}
{/each}
