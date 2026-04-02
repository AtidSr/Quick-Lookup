document.addEventListener("DOMContentLoaded", async () => {
    const dictionarySelect = document.getElementById("dictionarySelect");
    const customFields = document.getElementById("customFields");
    const customUrlInput = document.getElementById("customUrl");
    const hotkeyInput = document.getElementById("hotkeyInput");

    const saved = await browser.storage.sync.get([
        "dictionary",
        "customUrl",
        "hotkey"
    ]);

    dictionarySelect.value = saved.dictionary || "longman";
    customUrlInput.value = saved.customUrl || "";

    // Default hotkey
    const defaultHotkey = {
        ctrl: false,
        alt: true,
        shift: false,
        meta: false,
        key: "Alt",
        display: "Alt"
    };

    let currentShortcut = saved.hotkey || defaultHotkey;
    hotkeyInput.value = currentShortcut.display;

    function updateVisibility() {
        customFields.classList.toggle("hidden", dictionarySelect.value !== "custom");
    }
    updateVisibility();

    dictionarySelect.addEventListener("change", updateVisibility);

    // Capture multi-key shortcut
    hotkeyInput.addEventListener("keydown", (e) => {
        e.preventDefault();

        currentShortcut = {
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey,
            key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
            display: ""
        };

        const parts = [];
        if (currentShortcut.ctrl) parts.push("Ctrl");
        if (currentShortcut.alt) parts.push("Alt");
        if (currentShortcut.shift) parts.push("Shift");
        if (currentShortcut.meta) parts.push("Meta");

        if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
            parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
        }

        currentShortcut.display = parts.join(" + ");
        hotkeyInput.value = currentShortcut.display;
    });

    document.getElementById("saveBtn").addEventListener("click", async () => {
        await browser.storage.sync.set({
            dictionary: dictionarySelect.value,
            customUrl: customUrlInput.value,
            hotkey: currentShortcut
        });
        alert("Settings saved!");
    });
});