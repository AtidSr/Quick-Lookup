<script>
  import { onMount } from "svelte";
  import MarkdownPreview from "../components/MarkdownPreview.svelte";
  import { extensionApi } from "../lib/extension.js";
  import { parseMarkdown } from "../lib/markdown.js";

  const NOTEBOOK_KEY = "wordNotebook";
  const DEFAULT_NOTEBOOK = `# Word Notebook

`;
  const TOGGLE_ACTIVE_CLASS =
    "bg-blue-100 border-blue-600/30 text-slate-900 font-semibold dark:bg-cyan-400/15 dark:border-cyan-400/35 dark:text-slate-50";

  let notebookContent = $state(DEFAULT_NOTEBOOK);
  let statusMessage = $state("Loading your notebook...");
  let statusIsError = $state(false);
  let currentMode = $state("preview");
  let currentLayout = $state("single");

  let importInput = $state(null);
  let editorElement = $state(null);
  let statusTimer;

  const previewBlocks = $derived(
    parseMarkdown(notebookContent || DEFAULT_NOTEBOOK),
  );
  const singleLayout = $derived(currentLayout === "single");
  const showEditor = $derived(!singleLayout || currentMode === "edit");
  const showPreview = $derived(!singleLayout || currentMode === "preview");
  const workbenchClass = $derived(
    singleLayout
      ? "grid grid-cols-1 gap-[14px]"
      : "grid grid-cols-1 gap-[14px] lg:grid-cols-2",
  );
  const statusClass = $derived(
    statusIsError
      ? "font-medium text-rose-600 dark:text-rose-300"
      : "font-medium text-slate-600 dark:text-slate-300",
  );

  function buttonClass(active) {
    return [
      "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-900/10 bg-[#f4f6fd] p-0 text-slate-900 transition duration-150 hover:-translate-y-0.5 hover:bg-[#e8ecf8] dark:border-white/10 dark:bg-[#2a2d40] dark:text-slate-50 dark:hover:bg-[#32364c]",
      active ? TOGGLE_ACTIVE_CLASS : "",
    ].join(" ");
  }

  function setStatus(message, isError = false) {
    statusMessage = message;
    statusIsError = isError;

    clearTimeout(statusTimer);

    if (!isError) {
      statusTimer = setTimeout(() => {
        statusMessage = "Notebook ready.";
        statusIsError = false;
      }, 2500);
    }
  }

  async function loadNotebook() {
    if (!extensionApi) return;

    const stored = await extensionApi.storage.local.get(NOTEBOOK_KEY);
    notebookContent = stored[NOTEBOOK_KEY] || DEFAULT_NOTEBOOK;
    setStatus("Notebook ready.");
  }

  async function saveNotebook() {
    if (!extensionApi) return;

    await extensionApi.runtime.sendMessage({
      type: "save-notebook",
      notebookContent,
    });

    setStatus("Notebook saved.");
  }

  async function exportNotebook() {
    if (!extensionApi) return;

    const blob = new Blob([notebookContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    try {
      await extensionApi.downloads.download({
        url,
        filename: "quick-lookup-word-notebook.md",
        saveAs: true,
      });

      setStatus("Markdown export started.");
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }

  async function handleImportChange(event) {
    const [file] = event.currentTarget.files ?? [];
    if (!file || !extensionApi) return;

    try {
      const content = await file.text();
      notebookContent = content;

      await extensionApi.runtime.sendMessage({
        type: "save-notebook",
        notebookContent: content,
      });

      setStatus("Notebook imported and saved.");
    } catch (error) {
      console.error("Failed to import notebook", error);
      setStatus("Could not import that markdown file.", true);
    } finally {
      if (importInput) {
        importInput.value = "";
      }
    }
  }

  function setMode(mode) {
    currentMode = mode;
  }

  function setLayout(layout) {
    currentLayout = layout;

    if (layout === "single") {
      currentMode = "preview";
    }
  }

  onMount(() => {
    if (!extensionApi) {
      return undefined;
    }

    function handleStorageChange(changes, areaName) {
      if (areaName !== "local") return;
      if (!(NOTEBOOK_KEY in changes)) return;

      const nextNotebook = changes[NOTEBOOK_KEY].newValue || DEFAULT_NOTEBOOK;
      if (notebookContent !== nextNotebook) {
        notebookContent = nextNotebook;
      }
    }

    loadNotebook();
    extensionApi.storage.onChanged.addListener(handleStorageChange);

    return () => {
      clearTimeout(statusTimer);
      extensionApi.storage.onChanged.removeListener(handleStorageChange);
    };
  });

  $effect(() => {
    if (singleLayout && currentMode === "edit") {
      editorElement?.focus();
    }
  });
</script>

<header
  class="mx-auto w-full max-w-295 rounded-t-3xl border border-slate-900/10 border-b-slate-900/10 bg-[radial-gradient(circle_at_top_right,rgba(31,160,230,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] bg-white/85 px-4.5 py-4.5 shadow-[0_18px_48px_rgba(65,70,115,0.18)] backdrop-blur dark:border-white/10 dark:bg-[#2a2c3d]/90 dark:shadow-[0_24px_54px_rgba(0,0,0,0.34)] lg:px-7 lg:py-6.5"
>
  <h2 class="text-[clamp(1.7rem,2.8vw,2.4rem)] font-semibold tracking-[0.01em]">
    Word Notebook
  </h2>
</header>

<section
  class="sticky top-0 z-20 mx-auto w-full max-w-295 border-x border-slate-900/10 bg-white/85 shadow-[0_18px_48px_rgba(65,70,115,0.18)] backdrop-blur dark:border-white/10 dark:bg-[#2a2c3d]/90 dark:shadow-[0_24px_54px_rgba(0,0,0,0.34)]"
>
  <div
    class="flex flex-wrap items-center gap-3 border-b border-slate-900/10 p-3.5 dark:border-white/10"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-2.5">
      <button
        type="button"
        onclick={saveNotebook}
        class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-blue-700 p-0 text-white transition duration-150 hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
        title="Save Notebook"
        aria-label="Save Notebook"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 4h11l3 3v13H5z"></path>
          <path d="M8 4v6h8V4"></path>
          <path d="M9 19h6"></path>
        </svg>
      </button>
      <button
        type="button"
        onclick={() => importInput?.click()}
        class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-900/10 bg-[#f4f6fd] p-0 text-slate-900 transition duration-150 hover:-translate-y-0.5 hover:bg-[#e8ecf8] dark:border-white/10 dark:bg-[#2a2d40] dark:text-slate-50 dark:hover:bg-[#32364c]"
        title="Import Markdown"
        aria-label="Import Markdown"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 4v11"></path>
          <path d="M8 11l4 4 4-4"></path>
          <path d="M5 19h14"></path>
        </svg>
      </button>
      <button
        type="button"
        onclick={exportNotebook}
        class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-900/10 bg-[#f4f6fd] p-0 text-slate-900 transition duration-150 hover:-translate-y-0.5 hover:bg-[#e8ecf8] dark:border-white/10 dark:bg-[#2a2d40] dark:text-slate-50 dark:hover:bg-[#32364c]"
        title="Export Markdown"
        aria-label="Export Markdown"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 20V9"></path>
          <path d="M8 13l4-4 4 4"></path>
          <path d="M5 5h14"></path>
        </svg>
      </button>
    </div>

    <input
      bind:this={importInput}
      type="file"
      accept=".md,text/markdown,text/plain"
      class="hidden"
      onchange={handleImportChange}
    />

    <div
      class="ml-auto flex w-full flex-wrap items-center gap-3 md:w-auto md:flex-nowrap"
    >
      {#if singleLayout}
        <div class="flex w-full flex-col gap-2 md:w-auto">
          <div
            class="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap"
            role="tablist"
            aria-label="Notebook edit mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={currentMode === "edit"}
              onclick={() => setMode("edit")}
              class={buttonClass(currentMode === "edit")}
              title="Edit Markdown"
              aria-label="Edit Markdown"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                class="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 20l4.5-1 8.8-8.8-3.5-3.5L5 15.5z"></path>
                <path d="M13.8 6.7l3.5 3.5"></path>
              </svg>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentMode === "preview"}
              onclick={() => setMode("preview")}
              class={buttonClass(currentMode === "preview")}
              title="Preview Markdown"
              aria-label="Preview Markdown"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                class="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                ></path>
                <circle cx="12" cy="12" r="2.5"></circle>
              </svg>
            </button>
            <span
              class="inline-flex h-4.5 w-4.5 cursor-help items-center justify-center rounded-full border border-slate-900/10 bg-[#f4f6fd] text-[0.74rem] font-bold text-slate-900 dark:border-white/10 dark:bg-[#242739] dark:text-slate-50"
              aria-label="Edit mode switches the active pane in single view."
              title="Edit mode switches the active pane in single view."
              role="img">i</span
            >
            <span
              class="select-none text-base leading-none text-slate-500 dark:text-slate-300"
              aria-hidden="true">|</span
            >
          </div>
        </div>
      {/if}

      <div class="flex w-full flex-col gap-2 md:w-auto">
        <div
          class="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap"
          role="group"
          aria-label="Notebook view layout"
        >
          <button
            type="button"
            onclick={() => setLayout("single")}
            class={buttonClass(singleLayout)}
            title="Single Pane"
            aria-label="Single Pane"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              class="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="5" y="6" width="14" height="12" rx="1.5"></rect>
            </svg>
          </button>
          <button
            type="button"
            onclick={() => setLayout("split")}
            class={buttonClass(!singleLayout)}
            title="Split View"
            aria-label="Split View"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              class="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="4" y="6" width="16" height="12" rx="1.5"></rect>
              <path d="M12 6v12"></path>
            </svg>
          </button>
          <span
            class="inline-flex h-4.5 w-4.5 cursor-help items-center justify-center rounded-full border border-slate-900/10 bg-[#f4f6fd] text-[0.74rem] font-bold text-slate-900 dark:border-white/10 dark:bg-[#242739] dark:text-slate-50"
            aria-label="Position chooses one pane or side-by-side view."
            title="Position chooses one pane or side-by-side view."
            role="img">i</span
          >
        </div>
      </div>
    </div>
  </div>
</section>

<section
  class="mx-auto w-full max-w-295 rounded-b-3xl border border-t-0 border-slate-900/10 bg-white/85 px-4.5 py-6 shadow-[0_18px_48px_rgba(65,70,115,0.18)] backdrop-blur dark:border-white/10 dark:bg-[#2a2c3d]/90 dark:shadow-[0_24px_54px_rgba(0,0,0,0.34)] lg:px-7 lg:pt-1 lg:pb-7"
>
  <div
    class="mb-3.5 flex flex-wrap items-center justify-between gap-4 text-[0.94rem] text-slate-600 dark:text-slate-300"
  >
    <div class={statusClass}>{statusMessage}</div>
    <div>Preview updates from current markdown text.</div>
  </div>

  <div class={workbenchClass}>
    {#if showEditor}
      <div
        class="min-h-[62vh] overflow-hidden rounded-[20px] border border-slate-900/10 bg-white dark:border-white/10 dark:bg-[#2d3042]"
      >
        <textarea
          bind:this={editorElement}
          bind:value={notebookContent}
          spellcheck="false"
          aria-label="Word notebook markdown"
          class="min-h-[62vh] w-full resize-y border-0 bg-transparent px-5.5 py-5 font-[15px]/[1.68] font-[Cascadia_Code,Consolas,monospace] text-slate-900 outline-none ring-inset transition focus:ring-2 focus:ring-blue-600/30 dark:text-slate-50 dark:focus:ring-cyan-400/30"
        ></textarea>
      </div>
    {/if}

    {#if showPreview}
      <div
        class="min-h-[62vh] overflow-auto rounded-[20px] border border-slate-900/10 bg-white px-5.5 py-5.5 dark:border-white/10 dark:bg-[#2d3042]"
        aria-live="polite"
      >
        <MarkdownPreview blocks={previewBlocks} />
      </div>
    {/if}
  </div>

  <p class="mt-3.5 text-[0.93rem] leading-6 text-slate-600 dark:text-slate-300">
    Single-pane layout keeps one pane at a time. Split view shows both panes
    together and auto-hides edit-mode controls for a cleaner workspace.
  </p>
</section>
