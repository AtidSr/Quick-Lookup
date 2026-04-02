// 1. Use a robust state object with defaults to prevent null errors
const state = {
    selectedText: "",
    hotkey: {
        ctrl: false,
        alt: true,
        shift: false,
        meta: false,
        key: "Alt"
    }
};

// 2. Sync settings immediately
browser.storage.sync.get("hotkey").then((res) => {
    if (res.hotkey) state.hotkey = res.hotkey;
});

// 3. Listen for selection changes globally
document.addEventListener("selectionchange", () => {
    state.selectedText = window.getSelection().toString().trim();
});

// 4. The Optimized Listener
document.addEventListener("keydown", (e) => {
    const { hotkey, selectedText } = state;

    // A. Validation: Ensure we have something to look up
    if (!selectedText) return;

    // B. Modifier Check: Compare event modifiers against saved hotkey
    const modifiersMatch =
        e.ctrlKey === hotkey.ctrl &&
        e.altKey === hotkey.alt &&
        e.shiftKey === hotkey.shift &&
        e.metaKey === hotkey.meta;

    // C. Key Check: Compare the actual key (case-insensitive)
    const keyMatch = e.key.toLowerCase() === hotkey.key.toLowerCase();

    if (modifiersMatch && keyMatch) {
        // D. Prevent Default: Stops the browser from performing 
        // its own shortcut (e.g., Alt opening the browser menu)
        e.preventDefault();

        // E. Execution: Send to background
        browser.runtime.sendMessage({ word: selectedText });
    }
}, true); // Use 'true' for the capture phase if you want higher priority