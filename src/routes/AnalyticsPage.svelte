<script>
  import { onMount } from "svelte";
  import { buildDashboardData, formatRelativeDate } from "../lib/analytics.js";
  import { extensionApi } from "../lib/extension.js";

  const NOTEBOOK_KEY = "wordNotebook";
  const DEFAULT_NOTEBOOK = `# Word Notebook

`;
  const EMPTY_STATE = "Start looking up words to unlock your study analytics.";

  let notebookContent = $state(DEFAULT_NOTEBOOK);
  let analytics = $state({});
  let errorMessage = $state("");

  const dashboard = $derived(buildDashboardData(notebookContent, analytics));
  const maxWeekCount = $derived(
    Math.max(...dashboard.weekBuckets.map((bucket) => bucket.count), 1),
  );
  const topWord = $derived(dashboard.mostLookedUp[0] ?? null);
  const averageRevisits = $derived(
    dashboard.learnedWords
      ? (dashboard.totalLookups / dashboard.learnedWords).toFixed(1)
      : "0.0",
  );

  async function loadAnalyticsPage() {
    if (!extensionApi) return;

    try {
      const [stored, response] = await Promise.all([
        extensionApi.storage.local.get(NOTEBOOK_KEY),
        extensionApi.runtime.sendMessage({
          type: "get-word-analytics",
        }),
      ]);

      notebookContent = stored[NOTEBOOK_KEY] || DEFAULT_NOTEBOOK;
      analytics = response?.analytics || {};
      errorMessage = "";
    } catch (error) {
      console.error("Failed to load analytics page", error);
      errorMessage = "Could not load your study analytics right now.";
    }
  }

  onMount(() => {
    if (!extensionApi) {
      return undefined;
    }

    function handleStorageChange(changes, areaName) {
      if (areaName !== "local") return;
      if (NOTEBOOK_KEY in changes || "wordAnalytics" in changes) {
        loadAnalyticsPage();
      }
    }

    loadAnalyticsPage();
    extensionApi.storage.onChanged.addListener(handleStorageChange);

    return () => {
      extensionApi.storage.onChanged.removeListener(handleStorageChange);
    };
  });
</script>

<section
  class="mx-auto mb-4.5 w-full max-w-300 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,rgba(179,87,34,0.94),rgba(111,143,45,0.88)),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] p-4.5 text-[#fffdf9] shadow-[0_24px_50px_rgba(97,78,42,0.16)] lg:p-7"
>
  <div class="grid items-end gap-5 lg:grid-cols-[minmax(0,1.4fr)_220px]">
    <div>
      <h2
        class="text-[clamp(1.9rem,3vw,2.8rem)] font-semibold tracking-[0.01em]"
      >
        Word Analytics
      </h2>
      <p class="mt-3 max-w-180 text-sm leading-7 text-white/85 sm:text-base">
        See your learning momentum in one place. This page tracks how many times
        each word was looked up, how many new words you added this week, and
        which saved words deserve another pass.
      </p>
    </div>
    <div
      class="rounded-[22px] border border-white/20 bg-white/15 p-5 text-right backdrop-blur"
    >
      <strong class="block text-[clamp(2.4rem,4vw,3.4rem)] leading-none"
        >{dashboard.totalLookups}</strong
      >
      <span class="mt-2.5 block leading-6 text-white/80">
        {dashboard.totalLookups === 1
          ? "lookup recorded across your study notebook"
          : "lookups recorded across your study notebook"}
      </span>
    </div>
  </div>
</section>

<section class="mx-auto grid w-full max-w-300 gap-4.5">
  {#if errorMessage}
    <div
      class="rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-5 text-sm leading-6 text-rose-700 dark:text-rose-200"
    >
      {errorMessage}
    </div>
  {/if}

  <div class="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
    <article
      class="rounded-[22px] border border-stone-900/10 bg-white/85 p-4.5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
    >
      <span
        class="block text-[0.88rem] uppercase tracking-[0.08em] text-stone-500 dark:text-stone-300"
        >Words learned</span
      >
      <strong
        class="mt-3 block text-[clamp(1.8rem,2.6vw,2.5rem)] leading-none text-stone-950 dark:text-stone-50"
        >{dashboard.learnedWords}</strong
      >
      <span
        class="mt-2.5 block text-sm leading-6 text-stone-500 dark:text-stone-300"
        >Unique words saved in your notebook</span
      >
    </article>
    <article
      class="rounded-[22px] border border-stone-900/10 bg-white/85 p-4.5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
    >
      <span
        class="block text-[0.88rem] uppercase tracking-[0.08em] text-stone-500 dark:text-stone-300"
        >New words this week</span
      >
      <strong
        class="mt-3 block text-[clamp(1.8rem,2.6vw,2.5rem)] leading-none text-stone-950 dark:text-stone-50"
        >{dashboard.wordsThisWeek}</strong
      >
      <span
        class="mt-2.5 block text-sm leading-6 text-stone-500 dark:text-stone-300"
        >Vocabulary added in the last 7 days</span
      >
    </article>
    <article
      class="rounded-[22px] border border-stone-900/10 bg-white/85 p-4.5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
    >
      <span
        class="block text-[0.88rem] uppercase tracking-[0.08em] text-stone-500 dark:text-stone-300"
        >Average revisits</span
      >
      <strong
        class="mt-3 block text-[clamp(1.8rem,2.6vw,2.5rem)] leading-none text-stone-950 dark:text-stone-50"
        >{averageRevisits}</strong
      >
      <span
        class="mt-2.5 block text-sm leading-6 text-stone-500 dark:text-stone-300"
        >Lookup depth per saved word</span
      >
    </article>
    <article
      class="rounded-[22px] border border-stone-900/10 bg-white/85 p-4.5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
    >
      <span
        class="block text-[0.88rem] uppercase tracking-[0.08em] text-stone-500 dark:text-stone-300"
        >Review pool</span
      >
      <strong
        class="mt-3 block text-[clamp(1.8rem,2.6vw,2.5rem)] leading-none text-stone-950 dark:text-stone-50"
        >{dashboard.reviewPool}</strong
      >
      <span
        class="mt-2.5 block text-sm leading-6 text-stone-500 dark:text-stone-300"
        >Low-activity words ready for review</span
      >
    </article>
  </div>

  <div class="flex flex-wrap gap-2.5">
    {#if topWord}
      <div
        class="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-amber-700/20 bg-amber-700/10 px-3.5 py-2.5 text-sm text-stone-900 shadow-[0_18px_40px_rgba(97,78,42,0.12)] dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-stone-50"
      >
        Most looked up: <strong class="font-semibold">{topWord.word}</strong>
      </div>
      <div
        class="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-stone-900/10 bg-white/85 px-3.5 py-2.5 text-sm text-stone-700 shadow-[0_18px_40px_rgba(97,78,42,0.12)] dark:border-white/10 dark:bg-[#26211b]/90 dark:text-stone-200"
      >
        Top count: <strong
          class="font-semibold text-stone-950 dark:text-stone-50"
          >{topWord.lookupCount}</strong
        >
      </div>
      <div
        class="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-stone-900/10 bg-white/85 px-3.5 py-2.5 text-sm text-stone-700 shadow-[0_18px_40px_rgba(97,78,42,0.12)] dark:border-white/10 dark:bg-[#26211b]/90 dark:text-stone-200"
      >
        Least active set:
        <strong class="font-semibold text-stone-950 dark:text-stone-50">
          {dashboard.leastLookedUp.map((entry) => entry.word).join(", ") ||
            "None yet"}
        </strong>
      </div>
    {:else}
      <div
        class="rounded-[22px] border border-dashed border-stone-900/10 bg-white/55 px-4 py-5 text-sm leading-6 text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
      >
        {EMPTY_STATE}
      </div>
    {/if}
  </div>

  <div class="grid gap-3.5 xl:grid-cols-[1.45fr_1fr]">
    <article
      class="rounded-[22px] border border-stone-900/10 bg-white/85 p-5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
    >
      <h3 class="text-[1.08rem] font-semibold">New Words Per Week</h3>
      <p class="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-300">
        Weekly growth based on when a word first entered your notebook.
      </p>

      <div
        class="mt-5.5 grid min-h-60 grid-cols-2 items-end gap-2.5 sm:grid-cols-3 lg:grid-cols-6"
      >
        {#each dashboard.weekBuckets as bucket}
          <div class="flex flex-col items-center gap-2">
            <div
              class="flex h-37.5 w-full items-end rounded-[18px] border border-stone-900/10 bg-[#f6efe1] p-2 dark:border-white/10 dark:bg-[#302922]"
            >
              <div
                class="w-full rounded-xl bg-[linear-gradient(180deg,#6f8f2d,#b35722)]"
                style={`height: ${Math.max((bucket.count / maxWeekCount) * 100, bucket.count > 0 ? 12 : 0)}%`}
              ></div>
            </div>
            <strong
              class="text-[1.06rem] font-semibold text-stone-950 dark:text-stone-50"
              >{bucket.count}</strong
            >
            <span
              class="text-center text-[0.78rem] leading-[1.45] text-stone-500 dark:text-stone-300"
              >{bucket.label}</span
            >
          </div>
        {/each}
      </div>
    </article>

    <div class="grid gap-3.5">
      <article
        class="rounded-[22px] border border-stone-900/10 bg-white/85 p-5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
      >
        <h3 class="text-[1.08rem] font-semibold">Most Looked Up</h3>
        <p class="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-300">
          Your most revisited words right now.
        </p>

        {#if dashboard.mostLookedUp.length === 0}
          <p
            class="mt-4.5 text-sm leading-6 text-stone-500 dark:text-stone-300"
          >
            {EMPTY_STATE}
          </p>
        {:else}
          <ul class="mt-4.5 grid list-none gap-2.5 p-0">
            {#each dashboard.mostLookedUp as entry}
              <li
                class="flex items-center justify-between gap-3 rounded-2xl border border-stone-900/10 bg-[#f6efe1] px-3.5 py-3 dark:border-white/10 dark:bg-[#302922]"
              >
                <span
                  class="text-sm font-semibold text-stone-950 dark:text-stone-50"
                  >{entry.word}</span
                >
                <strong
                  class="text-sm font-semibold text-stone-500 dark:text-stone-300"
                >
                  {entry.lookupCount}
                  {entry.lookupCount === 1 ? "lookup" : "lookups"}
                </strong>
              </li>
            {/each}
          </ul>
        {/if}
      </article>

      <article
        class="rounded-[22px] border border-stone-900/10 bg-white/85 p-5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
      >
        <h3 class="text-[1.08rem] font-semibold">Least Looked Up</h3>
        <p class="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-300">
          Low-activity words that might need another review.
        </p>

        {#if dashboard.leastLookedUp.length === 0}
          <p
            class="mt-4.5 text-sm leading-6 text-stone-500 dark:text-stone-300"
          >
            Your least looked-up words will appear here.
          </p>
        {:else}
          <ul class="mt-4.5 grid list-none gap-2.5 p-0">
            {#each dashboard.leastLookedUp as entry}
              <li
                class="flex items-center justify-between gap-3 rounded-2xl border border-stone-900/10 bg-[#f6efe1] px-3.5 py-3 dark:border-white/10 dark:bg-[#302922]"
              >
                <span
                  class="text-sm font-semibold text-stone-950 dark:text-stone-50"
                  >{entry.word}</span
                >
                <strong
                  class="text-sm font-semibold text-stone-500 dark:text-stone-300"
                >
                  {entry.lookupCount}
                  {entry.lookupCount === 1 ? "lookup" : "lookups"}
                </strong>
              </li>
            {/each}
          </ul>
        {/if}
      </article>
    </div>
  </div>

  <article
    class="rounded-[22px] border border-stone-900/10 bg-white/85 p-5 shadow-[0_24px_50px_rgba(97,78,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#26211b]/90 dark:shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
  >
    <h3 class="text-[1.08rem] font-semibold">Recent Lookup Activity</h3>
    <p class="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-300">
      Words ordered by the most recent lookup time.
    </p>

    {#if dashboard.entries.length === 0}
      <p class="mt-4.5 text-sm leading-6 text-stone-500 dark:text-stone-300">
        {EMPTY_STATE}
      </p>
    {:else}
      <ul class="mt-4.5 grid list-none gap-2.5 p-0">
        {#each [...dashboard.entries]
          .sort((left, right) => new Date(right.lastLookupAt).getTime() - new Date(left.lastLookupAt).getTime())
          .slice(0, 6) as entry}
          <li
            class="flex items-center justify-between gap-3 rounded-2xl border border-stone-900/10 bg-[#f6efe1] px-3.5 py-3 dark:border-white/10 dark:bg-[#302922]"
          >
            <div class="min-w-0">
              <strong
                class="block text-sm font-semibold text-stone-950 dark:text-stone-50"
                >{entry.word}</strong
              >
              <span class="block text-sm text-stone-500 dark:text-stone-300"
                >Last checked {formatRelativeDate(entry.lastLookupAt)}</span
              >
            </div>
            <b
              class="inline-flex h-10.5 min-w-10.5 items-center justify-center rounded-full bg-amber-700/10 px-2 text-base font-semibold text-stone-900 dark:bg-amber-300/10 dark:text-stone-50"
              >{entry.lookupCount}</b
            >
          </li>
        {/each}
      </ul>
    {/if}
  </article>
</section>
