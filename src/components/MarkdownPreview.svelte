<script>
  import MarkdownInline from "./MarkdownInline.svelte";

  let { blocks = [] } = $props();
</script>

<div class="space-y-4">
  {#each blocks as block}
    {#if block.type === "heading" && block.level === 1}
      <h1
        class="mt-0 border-b border-slate-900/10 pb-2 text-3xl font-semibold leading-tight text-slate-950 dark:border-white/10 dark:text-slate-50"
      >
        <MarkdownInline segments={block.segments} />
      </h1>
    {:else if block.type === "heading" && block.level === 2}
      <h2
        class="mt-0 border-b border-slate-900/10 pb-2 text-2xl font-semibold leading-tight text-slate-950 dark:border-white/10 dark:text-slate-50"
      >
        <MarkdownInline segments={block.segments} />
      </h2>
    {:else if block.type === "heading" && block.level === 3}
      <h3
        class="mt-0 text-xl font-semibold leading-tight text-slate-950 dark:text-slate-50"
      >
        <MarkdownInline segments={block.segments} />
      </h3>
    {:else if block.type === "paragraph"}
      <p class="text-[15px] leading-7 text-slate-700 dark:text-slate-200">
        <MarkdownInline segments={block.segments} />
      </p>
    {:else if block.type === "blockquote"}
      <blockquote
        class="rounded-r-2xl border-l-[3px] border-blue-600 bg-blue-600/10 px-4 py-3 text-[15px] leading-7 text-slate-700 dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-slate-200"
      >
        <MarkdownInline segments={block.segments} />
      </blockquote>
    {:else if block.type === "list"}
      <ul class="list-disc pl-5.5">
        {#each block.items as item}
          <li class="text-[15px] leading-7 text-slate-700 dark:text-slate-200">
            <MarkdownInline segments={item} />
          </li>
        {/each}
      </ul>
    {:else if block.type === "code"}
      <pre
        class="overflow-x-auto rounded-2xl border border-slate-900/10 bg-[#f1f3fb] p-4 dark:border-white/10 dark:bg-[#24283a]"><code
          class="block bg-transparent p-0 font-[Cascadia_Code,Consolas,monospace] text-sm leading-7 text-slate-800 dark:text-slate-100"
          >{block.text}</code
        ></pre>
    {/if}
  {/each}
</div>
