<script>
  import { onMount } from "svelte";
  import { extensionApi } from "../lib/extension.js";
  import {
    DEFAULT_LOOKUP_SHORTCUT,
    DEFAULT_NOTEBOOK_SHORTCUT,
    DEFAULT_TOGGLE_LOOKUP_SHORTCUT,
    cloneShortcut,
    eventToShortcut,
  } from "../lib/shortcuts.js";

  let dictionary = $state("longman");
  let customUrl = $state("");
  let lookupShortcutEnabled = $state(true);
  let notebookOpenMode = $state("popup");
  let underlineStudiedWords = $state(false);
  let selectionPopupEnabled = $state(true);
  let lookupShortcut = $state(cloneShortcut(DEFAULT_LOOKUP_SHORTCUT));
  let toggleLookupShortcut = $state(
    cloneShortcut(DEFAULT_TOGGLE_LOOKUP_SHORTCUT),
  );
  let notebookShortcut = $state(cloneShortcut(DEFAULT_NOTEBOOK_SHORTCUT));
  let saveLabel = $state("Save Settings");
  let saveSucceeded = $state(false);

  let saveTimer;

  const showCustomFields = $derived(dictionary === "custom");
  const statusDotClass = $derived(
    lookupShortcutEnabled
      ? "bg-emerald-500 ring-4 ring-emerald-500/15"
      : "bg-rose-500 ring-4 ring-rose-500/15",
  );
  const saveButtonClass = $derived(
    saveSucceeded
      ? "bg-emerald-600 hover:bg-emerald-600"
      : "bg-blue-600 hover:bg-blue-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300",
  );

  function recordShortcut(kind, event) {
    event.preventDefault();

    if (event.key === "Backspace" || event.key === "Delete") {
      if (kind === "lookup") lookupShortcut = null;
      if (kind === "toggle") toggleLookupShortcut = null;
      if (kind === "notebook") notebookShortcut = null;
      return;
    }

    const { shortcut } = eventToShortcut(event);

    if (kind === "lookup") lookupShortcut = shortcut;
    if (kind === "toggle") toggleLookupShortcut = shortcut;
    if (kind === "notebook") notebookShortcut = shortcut;
  }

  async function saveSettings() {
    if (!extensionApi) return;

    if (!lookupShortcut?.key) {
      alert("Please press a full lookup shortcut, for example Alt + L.");
      return;
    }

    if (!notebookShortcut?.key) {
      alert("Please press a full notebook shortcut, for example Alt + N.");
      return;
    }

    if (!toggleLookupShortcut?.key) {
      alert(
        "Please press a full popup toggle shortcut, for example Ctrl + Alt + L.",
      );
      return;
    }

    await extensionApi.storage.sync.set({
      dictionary,
      customUrl,
      hotkey: lookupShortcut,
      lookupShortcutEnabled,
      toggleLookupHotkey: toggleLookupShortcut,
      notebookHotkey: notebookShortcut,
      notebookOpenMode,
      underlineStudiedWords,
      selectionPopupEnabled,
    });

    saveLabel = "Saved!";
    saveSucceeded = true;

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveLabel = "Save Settings";
      saveSucceeded = false;
    }, 1500);
  }

  onMount(() => {
    if (!extensionApi) {
      return undefined;
    }

    let disposed = false;

    async function loadSettings() {
      const saved = await extensionApi.storage.sync.get([
        "dictionary",
        "customUrl",
        "hotkey",
        "lookupShortcutEnabled",
        "toggleLookupHotkey",
        "notebookHotkey",
        "notebookOpenMode",
        "underlineStudiedWords",
        "selectionPopupEnabled",
      ]);

      if (disposed) return;

      dictionary = saved.dictionary || "longman";
      customUrl = saved.customUrl || "";
      lookupShortcutEnabled = saved.lookupShortcutEnabled ?? true;
      notebookOpenMode = saved.notebookOpenMode || "popup";
      underlineStudiedWords = Boolean(saved.underlineStudiedWords);
      selectionPopupEnabled = saved.selectionPopupEnabled ?? true;
      lookupShortcut = cloneShortcut(saved.hotkey, DEFAULT_LOOKUP_SHORTCUT);
      toggleLookupShortcut = cloneShortcut(
        saved.toggleLookupHotkey,
        DEFAULT_TOGGLE_LOOKUP_SHORTCUT,
      );
      notebookShortcut = cloneShortcut(
        saved.notebookHotkey,
        DEFAULT_NOTEBOOK_SHORTCUT,
      );
    }

    function handleStorageChange(changes, areaName) {
      if (areaName !== "sync") return;

      if (changes.dictionary)
        dictionary = changes.dictionary.newValue || "longman";
      if (changes.customUrl) customUrl = changes.customUrl.newValue || "";
      if (changes.lookupShortcutEnabled)
        lookupShortcutEnabled = Boolean(changes.lookupShortcutEnabled.newValue);
      if (changes.notebookOpenMode)
        notebookOpenMode = changes.notebookOpenMode.newValue || "popup";
      if (changes.underlineStudiedWords)
        underlineStudiedWords = Boolean(changes.underlineStudiedWords.newValue);
      if (changes.selectionPopupEnabled)
        selectionPopupEnabled = Boolean(changes.selectionPopupEnabled.newValue);
      if (changes.hotkey)
        lookupShortcut = cloneShortcut(
          changes.hotkey.newValue,
          DEFAULT_LOOKUP_SHORTCUT,
        );
      if (changes.toggleLookupHotkey)
        toggleLookupShortcut = cloneShortcut(
          changes.toggleLookupHotkey.newValue,
          DEFAULT_TOGGLE_LOOKUP_SHORTCUT,
        );
      if (changes.notebookHotkey)
        notebookShortcut = cloneShortcut(
          changes.notebookHotkey.newValue,
          DEFAULT_NOTEBOOK_SHORTCUT,
        );
    }

    loadSettings();
    extensionApi.storage.onChanged.addListener(handleStorageChange);

    return () => {
      disposed = true;
      clearTimeout(saveTimer);
      extensionApi.storage.onChanged.removeListener(handleStorageChange);
    };
  });
</script>

<section
  class="mx-auto max-w-215 overflow-hidden rounded-3xl border border-slate-900/10 bg-white/85 shadow-[0_18px_44px_rgba(80,80,120,0.14)] backdrop-blur dark:border-white/10 dark:bg-[#2b2a33]/90 dark:shadow-[0_22px_48px_rgba(0,0,0,0.35)]"
>
  <header
    class="border-b border-slate-900/10 bg-[radial-gradient(circle_at_top_right,rgba(0,221,255,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)] px-4.5 py-4.5 dark:border-white/10 lg:px-7 lg:py-7"
  >
    <h2 class="text-[clamp(1.7rem,3vw,2.3rem)] font-semibold tracking-tight">
      Settings
    </h2>
    <p
      class="mt-2.5 max-w-155 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base"
    >
      Choose how Quick Lookup opens dictionary pages, set the lookup shortcut,
      and add a separate shortcut for opening your notebook in a popup or a tab.
    </p>
  </header>

  <section class="space-y-5 p-4.5 lg:p-7">
    <div class="space-y-2">
      <label for="dictionarySelect" class="block text-sm font-semibold"
        >Choose Dictionary</label
      >
      <select
        id="dictionarySelect"
        bind:value={dictionary}
        class="w-full rounded-2xl border border-slate-900/10 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#23222b] dark:text-slate-50 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
      >
        <option value="longman">Longman</option>
        <option value="cambridge">Cambridge</option>
        <option value="oxford">Oxford</option>
        <option value="custom">Custom</option>
      </select>
    </div>

    {#if showCustomFields}
      <div class="space-y-2">
        <label for="customUrl" class="block text-sm font-semibold"
          >Custom URL Pattern</label
        >
        <input
          id="customUrl"
          type="text"
          bind:value={customUrl}
          placeholder="https://example.com/search/{keyword}"
          class="w-full rounded-2xl border border-slate-900/10 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#23222b] dark:text-slate-50 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
        />
        <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Use <strong>{`{keyword}`}</strong> where the selected word should
          appear. Example: <code>https://site.com/search?q={"{keyword}"}</code>
        </p>
      </div>
    {/if}

    <div class="space-y-2">
      <label for="hotkeyInput" class="block text-sm font-semibold"
        >Activation Key</label
      >
      <input
        id="hotkeyInput"
        type="text"
        readonly
        value={lookupShortcut?.display ?? ""}
        placeholder="Press a key..."
        onkeydown={(event) => recordShortcut("lookup", event)}
        class="w-full rounded-2xl border border-slate-900/10 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#23222b] dark:text-slate-50 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
      />
      <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
        Record a complete combination such as <code>Alt + L</code> or
        <code>Ctrl + Shift + D</code>.
      </p>
    </div>

    <div class="space-y-2">
      <label for="lookupShortcutEnabled" class="block text-sm font-semibold"
        >Activate Status</label
      >
      <div
        class="flex items-start gap-3.5 rounded-2xl border border-slate-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#23222b]"
      >
        <input
          id="lookupShortcutEnabled"
          type="checkbox"
          bind:checked={lookupShortcutEnabled}
          class="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-white/20 dark:bg-[#23222b] dark:text-cyan-400 dark:focus:ring-cyan-400"
        />
        <div class="flex w-full flex-col gap-1">
          <div
            class="mb-1 inline-flex items-center gap-2 text-[0.95rem] font-semibold"
          >
            <span
              class={`h-2.5 w-2.5 rounded-full transition-colors ${statusDotClass}`}
              aria-hidden="true"
            ></span>
            <strong>{lookupShortcutEnabled ? "Active" : "Not Active"}</strong>
          </div>
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
            {lookupShortcutEnabled
              ? "Popup shortcut is active"
              : "Popup shortcut is not active"}
          </span>
          <div class="mt-2.5 space-y-1.5">
            <label
              for="toggleLookupHotkeyInput"
              class="block text-sm font-semibold"
              >Toggle Popup Shortcut Key</label
            >
            <input
              id="toggleLookupHotkeyInput"
              type="text"
              readonly
              value={toggleLookupShortcut?.display ?? ""}
              placeholder="Press a key..."
              onkeydown={(event) => recordShortcut("toggle", event)}
              class="w-full rounded-2xl border border-slate-900/10 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#2b2a33] dark:text-slate-50 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
            />
          </div>
          <span class="text-sm leading-6 text-slate-600 dark:text-slate-300"
            >Turn the main save-and-open-popup shortcut on or off without
            changing your saved shortcut.</span
          >
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <label for="notebookHotkeyInput" class="block text-sm font-semibold"
        >Notebook Shortcut</label
      >
      <input
        id="notebookHotkeyInput"
        type="text"
        readonly
        value={notebookShortcut?.display ?? ""}
        placeholder="Press a key..."
        onkeydown={(event) => recordShortcut("notebook", event)}
        class="w-full rounded-2xl border border-slate-900/10 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#23222b] dark:text-slate-50 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
      />
      <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
        Use a separate shortcut such as <code>Alt + N</code> to open the notebook
        quickly from any page.
      </p>
    </div>

    <div class="space-y-2">
      <label for="notebookOpenMode" class="block text-sm font-semibold"
        >Notebook Opens As</label
      >
      <select
        id="notebookOpenMode"
        bind:value={notebookOpenMode}
        class="w-full rounded-2xl border border-slate-900/10 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#23222b] dark:text-slate-50 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
      >
        <option value="popup">Popup window</option>
        <option value="tab">New tab</option>
      </select>
      <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
        This affects the notebook shortcut and the toolbar button, so you can
        choose the view that feels faster for you.
      </p>
    </div>

    <div class="space-y-2">
      <label for="underlineToggle" class="block text-sm font-semibold"
        >Study Word Underline</label
      >
      <div
        class="flex items-start gap-3.5 rounded-2xl border border-slate-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#23222b]"
      >
        <input
          id="underlineToggle"
          type="checkbox"
          bind:checked={underlineStudiedWords}
          class="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-white/20 dark:bg-[#23222b] dark:text-cyan-400 dark:focus:ring-cyan-400"
        />
        <div class="flex w-full flex-col gap-1">
          <strong class="text-[0.98rem] font-semibold"
            >Underline studied words on web pages</strong
          >
          <span class="text-sm leading-6 text-slate-600 dark:text-slate-300"
            >Only words saved as notebook headings like <code>## word</code> are
            underlined. Translation and notes are ignored.</span
          >
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <label for="selectionPopupEnabled" class="block text-sm font-semibold"
        >Selection Popup</label
      >
      <div
        class="flex items-start gap-3.5 rounded-2xl border border-slate-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#23222b]"
      >
        <input
          id="selectionPopupEnabled"
          type="checkbox"
          bind:checked={selectionPopupEnabled}
          class="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-white/20 dark:bg-[#23222b] dark:text-cyan-400 dark:focus:ring-cyan-400"
        />
        <div class="flex w-full flex-col gap-1">
          <strong class="text-[0.98rem] font-semibold"
            >Show a pop up icon</strong
          >
          <span class="text-sm leading-6 text-slate-600 dark:text-slate-300"
            >When you select text on a page, Quick Lookup shows a small pop up
            icon close to the selection. Click it to open your selected word in
            the current dictionary.</span
          >
        </div>
      </div>
    </div>

    <button
      type="button"
      onclick={saveSettings}
      class={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 ${saveButtonClass}`}
    >
      {saveLabel}
    </button>
  </section>
</section>
