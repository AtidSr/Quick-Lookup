document.addEventListener("DOMContentLoaded", async () => {
    const DEFAULT_LOOKUP_SHORTCUT = {
        ctrl: false,
        alt: true,
        shift: false,
        meta: false,
        key: "Alt",
        display: "Alt"
    };
    const DEFAULT_TOGGLE_LOOKUP_SHORTCUT = {
        ctrl: true,
        alt: true,
        shift: false,
        meta: false,
        key: "l",
        display: "Ctrl + Alt + L"
    };
    const DEFAULT_NOTEBOOK_SHORTCUT = {
        ctrl: false,
        alt: true,
        shift: false,
        meta: false,
        key: "n",
        display: "Alt + N"
    };

    const elements = {
        dictionarySelect: document.getElementById("dictionarySelect"),
        customFields: document.getElementById("customFields"),
        customUrlInput: document.getElementById("customUrl"),
        hotkeyInput: document.getElementById("hotkeyInput"),
        lookupShortcutEnabled: document.getElementById("lookupShortcutEnabled"),
        toggleLookupHotkeyInput: document.getElementById("toggleLookupHotkeyInput"),
        notebookHotkeyInput: document.getElementById("notebookHotkeyInput"),
        notebookOpenMode: document.getElementById("notebookOpenMode"),
        underlineToggle: document.getElementById("underlineToggle"),
        saveBtn: document.getElementById("saveBtn")
    };

    const saved = await browser.storage.sync.get([
        "dictionary",
        "customUrl",
        "hotkey",
        "lookupShortcutEnabled",
        "toggleLookupHotkey",
        "notebookHotkey",
        "notebookOpenMode",
        "underlineStudiedWords"
    ]);

    elements.dictionarySelect.value = saved.dictionary || "longman";
    elements.customUrlInput.value = saved.customUrl || "";
    elements.lookupShortcutEnabled.checked = saved.lookupShortcutEnabled ?? true;
    elements.notebookOpenMode.value = saved.notebookOpenMode || "popup";
    elements.underlineToggle.checked = Boolean(saved.underlineStudiedWords);

    let currentShortcut = saved.hotkey || DEFAULT_LOOKUP_SHORTCUT;
    let currentToggleLookupShortcut = saved.toggleLookupHotkey || DEFAULT_TOGGLE_LOOKUP_SHORTCUT;
    let currentNotebookShortcut = saved.notebookHotkey || DEFAULT_NOTEBOOK_SHORTCUT;
    elements.hotkeyInput.value = currentShortcut.display;
    elements.toggleLookupHotkeyInput.value = currentToggleLookupShortcut.display;
    elements.notebookHotkeyInput.value = currentNotebookShortcut.display;

    const updateVisibility = () => {
        elements.customFields.classList.toggle("hidden", elements.dictionarySelect.value !== "custom");
    };
    elements.dictionarySelect.addEventListener("change", updateVisibility);
    updateVisibility();

    const attachShortcutRecorder = (input, onCommit) => {
        input.addEventListener("keydown", (e) => {
            e.preventDefault();

            if (e.key === "Backspace" || e.key === "Delete") {
                input.value = "";
                onCommit(null);
                return;
            }

            const isModifierOnly = ["Control", "Shift", "Alt", "Meta"].includes(e.key);
            const newShortcut = {
                ctrl: e.ctrlKey,
                alt: e.altKey,
                shift: e.shiftKey,
                meta: e.metaKey,
                key: isModifierOnly ? "" : e.key,
                display: ""
            };

            const parts = [];
            if (newShortcut.ctrl) parts.push("Ctrl");
            if (newShortcut.alt) parts.push("Alt");
            if (newShortcut.shift) parts.push("Shift");
            if (newShortcut.meta) parts.push("Meta");
            if (!isModifierOnly) parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);

            newShortcut.display = parts.join(" + ");
            input.value = newShortcut.display;

            if (!isModifierOnly) {
                onCommit(newShortcut);
            }
        });
    };

    attachShortcutRecorder(elements.hotkeyInput, (shortcut) => {
        currentShortcut = shortcut;
    });

    attachShortcutRecorder(elements.toggleLookupHotkeyInput, (shortcut) => {
        currentToggleLookupShortcut = shortcut;
    });

    attachShortcutRecorder(elements.notebookHotkeyInput, (shortcut) => {
        currentNotebookShortcut = shortcut;
    });

    elements.saveBtn.addEventListener("click", async () => {
        if (!currentShortcut?.key) {
            alert("Please press a full lookup shortcut, for example Alt + L.");
            return;
        }

        if (!currentNotebookShortcut?.key) {
            alert("Please press a full notebook shortcut, for example Alt + N.");
            return;
        }

        if (!currentToggleLookupShortcut?.key) {
            alert("Please press a full popup toggle shortcut, for example Ctrl + Alt + L.");
            return;
        }

        await browser.storage.sync.set({
            dictionary: elements.dictionarySelect.value,
            customUrl: elements.customUrlInput.value,
            hotkey: currentShortcut,
            lookupShortcutEnabled: elements.lookupShortcutEnabled.checked,
            toggleLookupHotkey: currentToggleLookupShortcut,
            notebookHotkey: currentNotebookShortcut,
            notebookOpenMode: elements.notebookOpenMode.value,
            underlineStudiedWords: elements.underlineToggle.checked
        });

        const originalText = elements.saveBtn.textContent;
        elements.saveBtn.textContent = "Saved!";
        elements.saveBtn.style.background = "#28a745";

        setTimeout(() => {
            elements.saveBtn.textContent = originalText;
            elements.saveBtn.style.background = "";
        }, 1500);
    });
});
