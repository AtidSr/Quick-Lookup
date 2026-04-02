let selectedText = "";
let hotkey = null;

// Load saved shortcut
browser.storage.sync.get("hotkey").then((res) => {
    hotkey = res.hotkey || {
        ctrl: false,
        alt: true,
        shift: false,
        meta: false,
        key: "Alt"
    };
});

document.addEventListener("mouseup", () => {
    selectedText = window.getSelection().toString().trim();
});

document.addEventListener("keydown", (e) => {
    console.log(hotkey, selectedText, e);
    if (!hotkey || !selectedText) return;

    const match =
        e.ctrlKey === hotkey.ctrl &&
        e.altKey === hotkey.alt &&
        e.shiftKey === hotkey.shift &&
        e.metaKey === hotkey.meta &&
        (
            e.key.toLowerCase() === hotkey.key.toLowerCase() ||
            e.key === hotkey.key
        );

    if (match) {
        browser.runtime.sendMessage({ word: selectedText });
    }
});