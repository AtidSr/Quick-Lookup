document.addEventListener("DOMContentLoaded", async () => {
    const elements = {
        dictionarySelect: document.getElementById("dictionarySelect"),
        customFields: document.getElementById("customFields"),
        customUrlInput: document.getElementById("customUrl"),
        hotkeyInput: document.getElementById("hotkeyInput"),
        saveBtn: document.getElementById("saveBtn")
    };

    // 1. Load Settings with a clear fallback
    const saved = await browser.storage.sync.get(["dictionary", "customUrl", "hotkey"]);

    elements.dictionarySelect.value = saved.dictionary || "longman";
    elements.customUrlInput.value = saved.customUrl || "";

    let currentShortcut = saved.hotkey || {
        ctrl: false, alt: true, shift: false, meta: false,
        key: "Alt", display: "Alt"
    };
    elements.hotkeyInput.value = currentShortcut.display;

    // 2. UI Logic: Toggle custom URL visibility
    const updateVisibility = () => {
        elements.customFields.classList.toggle("hidden", elements.dictionarySelect.value !== "custom");
    };
    elements.dictionarySelect.addEventListener("change", updateVisibility);
    updateVisibility();

    // 3. Robust Shortcut Recorder
    elements.hotkeyInput.addEventListener("keydown", (e) => {
        e.preventDefault();

        // Identify if the key pressed is just a modifier (Ctrl, Alt, etc.)
        const isModifierOnly = ["Control", "Shift", "Alt", "Meta"].includes(e.key);

        // We only want to finalize the shortcut if a "real" key is pressed
        const newShortcut = {
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey,
            // If it's a modifier, we wait. If it's a key, we save it.
            key: isModifierOnly ? "" : e.key,
            display: ""
        };

        // Build the display string (e.g., "Ctrl + Shift + L")
        const parts = [];
        if (newShortcut.ctrl) parts.push("Ctrl");
        if (newShortcut.alt) parts.push("Alt");
        if (newShortcut.shift) parts.push("Shift");
        if (newShortcut.meta) parts.push("Meta");
        if (!isModifierOnly) parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);

        newShortcut.display = parts.join(" + ");
        elements.hotkeyInput.value = newShortcut.display;

        // Only update our internal state if a non-modifier key was pressed
        if (!isModifierOnly) {
            currentShortcut = newShortcut;
        }
    });

    // 4. Save Logic with Feedback
    elements.saveBtn.addEventListener("click", async () => {
        if (!currentShortcut.key) {
            alert("Please press a full key combination (e.g., Alt + L)");
            return;
        }

        await browser.storage.sync.set({
            dictionary: elements.dictionarySelect.value,
            customUrl: elements.customUrlInput.value,
            hotkey: currentShortcut
        });

        // Professional touch: Change button text instead of a jumpy alert
        const originalText = elements.saveBtn.textContent;
        elements.saveBtn.textContent = "Saved!";
        elements.saveBtn.style.background = "#28a745";

        setTimeout(() => {
            elements.saveBtn.textContent = originalText;
            elements.saveBtn.style.background = "";
        }, 1500);
    });
});