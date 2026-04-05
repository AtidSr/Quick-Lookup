const NOTEBOOK_KEY = "wordNotebook";
const UNDERLINE_SETTING_KEY = "underlineStudiedWords";
const NOTEBOOK_SHORTCUT_KEY = "notebookHotkey";
const TOGGLE_LOOKUP_SHORTCUT_KEY = "toggleLookupHotkey";
const LOOKUP_SHORTCUT_ENABLED_KEY = "lookupShortcutEnabled";
const UNDERLINE_CLASS = "quick-lookup-studied-word";
const STYLE_ID = "quick-lookup-studied-style";
const TOAST_ID = "quick-lookup-toast";
const EXCLUDED_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
    "BUTTON",
    "CODE",
    "PRE"
]);

const state = {
    selectedText: "",
    hotkey: {
        ctrl: false,
        alt: true,
        shift: false,
        meta: false,
        key: "Alt"
    },
    lookupShortcutEnabled: true,
    toggleLookupHotkey: {
        ctrl: true,
        alt: true,
        shift: false,
        meta: false,
        key: "l"
    },
    notebookHotkey: {
        ctrl: false,
        alt: true,
        shift: false,
        meta: false,
        key: "n"
    },
    underlineStudiedWords: false,
    studiedWords: [],
    observer: null,
    refreshTimer: null,
    isApplyingUnderlines: false,
    isPointerSelecting: false,
    pendingRefresh: false,
    toastTimer: null
};

function isEnglishStudyHeading(line) {
    const match = line.match(/^##\s+([A-Za-z]+(?:[ '-][A-Za-z]+)*)\s*$/);
    return match ? match[1].trim() : "";
}

function parseStudiedWords(markdown) {
    return markdown
        .split(/\r?\n/)
        .map(isEnglishStudyHeading)
        .filter(Boolean);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureUnderlineStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .${UNDERLINE_CLASS} {
            text-decoration-line: underline;
            text-decoration-thickness: 0.14em;
            text-decoration-color: rgba(26, 77, 232, 0.75);
            text-underline-offset: 0.18em;
        }

        @media (prefers-color-scheme: dark) {
            .${UNDERLINE_CLASS} {
                text-decoration-color: rgba(103, 196, 255, 0.86);
            }
        }
    `;

    document.documentElement.appendChild(style);
}

function ensureToast() {
    let toast = document.getElementById(TOAST_ID);
    if (toast) return toast;

    toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = [
        "position: fixed",
        "right: 18px",
        "bottom: 18px",
        "z-index: 2147483647",
        "padding: 10px 14px",
        "border-radius: 12px",
        "background: rgba(20, 24, 34, 0.92)",
        "color: #fff",
        "font: 13px/1.4 'Segoe UI', system-ui, sans-serif",
        "box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24)",
        "opacity: 0",
        "transform: translateY(8px)",
        "pointer-events: none",
        "transition: opacity 0.18s ease, transform 0.18s ease"
    ].join(";");

    document.documentElement.appendChild(toast);
    return toast;
}

function showToast(message) {
    const toast = ensureToast();
    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    if (state.toastTimer) {
        clearTimeout(state.toastTimer);
    }

    state.toastTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
    }, 1600);
}

function clearUnderlines() {
    const highlighted = document.querySelectorAll(`span.${UNDERLINE_CLASS}`);

    for (const node of highlighted) {
        const parent = node.parentNode;
        if (!parent) continue;

        parent.replaceChild(document.createTextNode(node.textContent || ""), node);
        parent.normalize();
    }
}

function isExcludedNode(node) {
    const parentElement = node.parentElement;
    if (!parentElement) return true;
    if (parentElement.closest(`span.${UNDERLINE_CLASS}`)) return true;
    if (parentElement.closest("[contenteditable='true']")) return true;

    let current = parentElement;
    while (current) {
        if (EXCLUDED_TAGS.has(current.tagName)) return true;
        current = current.parentElement;
    }

    return false;
}

function buildWordRegex(words) {
    if (words.length === 0) return null;

    const sortedWords = [...new Set(words.map((word) => word.toLowerCase()))]
        .sort((a, b) => b.length - a.length)
        .map(escapeRegex);

    if (sortedWords.length === 0) return null;

    return new RegExp(`\\b(${sortedWords.join("|")})\\b`, "gi");
}

function underlineTextNode(node, regex) {
    const text = node.nodeValue;
    if (!text || !regex.test(text)) {
        regex.lastIndex = 0;
        return;
    }

    regex.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const [matchedWord] = match;
        const start = match.index;

        if (start > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
        }

        const span = document.createElement("span");
        span.className = UNDERLINE_CLASS;
        span.textContent = matchedWord;
        fragment.appendChild(span);

        lastIndex = start + matchedWord.length;
    }

    if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    const parent = node.parentNode;
    if (parent) {
        parent.replaceChild(fragment, node);
    }
}

function applyUnderlines() {
    if (!document.body) return;
    if (state.isPointerSelecting || hasActiveSelection()) {
        state.pendingRefresh = true;
        return;
    }

    state.isApplyingUnderlines = true;
    const observer = state.observer;

    if (observer) {
        observer.disconnect();
    }

    try {
        clearUnderlines();

        if (!state.underlineStudiedWords || state.studiedWords.length === 0) return;

        ensureUnderlineStyle();

        const regex = buildWordRegex(state.studiedWords);
        if (!regex) return;

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                return isExcludedNode(node)
                    ? NodeFilter.FILTER_REJECT
                    : NodeFilter.FILTER_ACCEPT;
            }
        });

        const nodes = [];
        let currentNode;

        while ((currentNode = walker.nextNode())) {
            nodes.push(currentNode);
        }

        for (const node of nodes) {
            underlineTextNode(node, regex);
        }
    } finally {
        state.isApplyingUnderlines = false;
        if (observer && document.body) {
            observer.observe(document.body, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }
    }
}

function scheduleUnderlineRefresh() {
    if (state.isPointerSelecting || hasActiveSelection()) {
        state.pendingRefresh = true;
        return;
    }

    if (state.refreshTimer) {
        clearTimeout(state.refreshTimer);
    }

    state.refreshTimer = setTimeout(() => {
        state.pendingRefresh = false;
        applyUnderlines();
    }, 120);
}

function hasActiveSelection() {
    const selection = window.getSelection();
    return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
}

function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest("[contenteditable='true']")) return true;

    const editableTagNames = new Set(["INPUT", "TEXTAREA", "SELECT"]);
    return editableTagNames.has(target.tagName);
}

function hasModifierConflict(event, shortcut) {
    return (
        event.ctrlKey !== Boolean(shortcut.ctrl) ||
        event.altKey !== Boolean(shortcut.alt) ||
        event.shiftKey !== Boolean(shortcut.shift) ||
        event.metaKey !== Boolean(shortcut.meta)
    );
}

function matchesShortcut(event, shortcut) {
    if (!shortcut?.key) return false;
    if (hasModifierConflict(event, shortcut)) return false;
    return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

function flushPendingRefresh() {
    if (!state.pendingRefresh) return;
    if (state.isPointerSelecting || hasActiveSelection()) return;
    scheduleUnderlineRefresh();
}

function ensureObserver() {
    if (state.observer || !document.body) return;

    state.observer = new MutationObserver((mutations) => {
        if (!state.underlineStudiedWords || state.isApplyingUnderlines) return;

        const hasRealChange = mutations.some((mutation) => {
            if (mutation.type === "characterData") return true;
            return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
        });

        if (hasRealChange) {
            scheduleUnderlineRefresh();
        }
    });

    state.observer.observe(document.body, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

async function loadUnderlineState() {
    const [syncSettings, localSettings] = await Promise.all([
        browser.storage.sync.get([
            UNDERLINE_SETTING_KEY,
            "hotkey",
            NOTEBOOK_SHORTCUT_KEY,
            TOGGLE_LOOKUP_SHORTCUT_KEY,
            LOOKUP_SHORTCUT_ENABLED_KEY
        ]),
        browser.storage.local.get(NOTEBOOK_KEY)
    ]);

    if (syncSettings.hotkey) {
        state.hotkey = syncSettings.hotkey;
    }

    if (syncSettings[TOGGLE_LOOKUP_SHORTCUT_KEY]) {
        state.toggleLookupHotkey = syncSettings[TOGGLE_LOOKUP_SHORTCUT_KEY];
    }

    if (LOOKUP_SHORTCUT_ENABLED_KEY in syncSettings) {
        state.lookupShortcutEnabled = Boolean(syncSettings[LOOKUP_SHORTCUT_ENABLED_KEY]);
    }

    if (syncSettings[NOTEBOOK_SHORTCUT_KEY]) {
        state.notebookHotkey = syncSettings[NOTEBOOK_SHORTCUT_KEY];
    }

    state.underlineStudiedWords = Boolean(syncSettings[UNDERLINE_SETTING_KEY]);
    state.studiedWords = parseStudiedWords(localSettings[NOTEBOOK_KEY] || "");
}

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
        if (changes.hotkey?.newValue) {
            state.hotkey = changes.hotkey.newValue;
        }

        if (changes[TOGGLE_LOOKUP_SHORTCUT_KEY]?.newValue) {
            state.toggleLookupHotkey = changes[TOGGLE_LOOKUP_SHORTCUT_KEY].newValue;
        }

        if (LOOKUP_SHORTCUT_ENABLED_KEY in changes) {
            state.lookupShortcutEnabled = Boolean(changes[LOOKUP_SHORTCUT_ENABLED_KEY].newValue);
        }

        if (changes[NOTEBOOK_SHORTCUT_KEY]?.newValue) {
            state.notebookHotkey = changes[NOTEBOOK_SHORTCUT_KEY].newValue;
        }

        if (UNDERLINE_SETTING_KEY in changes) {
            state.underlineStudiedWords = Boolean(changes[UNDERLINE_SETTING_KEY].newValue);
            scheduleUnderlineRefresh();
        }
    }

    if (areaName === "local" && NOTEBOOK_KEY in changes) {
        state.studiedWords = parseStudiedWords(changes[NOTEBOOK_KEY].newValue || "");
        scheduleUnderlineRefresh();
    }
});

document.addEventListener("selectionchange", () => {
    state.selectedText = window.getSelection().toString().trim();
    flushPendingRefresh();
});

document.addEventListener("mousedown", () => {
    state.isPointerSelecting = true;
});

document.addEventListener("mouseup", () => {
    state.isPointerSelecting = false;
    setTimeout(() => {
        flushPendingRefresh();
    }, 80);
});

document.addEventListener("keydown", (e) => {
    if (isEditableTarget(e.target)) return;

    if (matchesShortcut(e, state.toggleLookupHotkey)) {
        e.preventDefault();
        browser.runtime.sendMessage({
            type: "toggle-lookup-shortcut-enabled"
        }).then((response) => {
            const isEnabled = Boolean(response?.enabled);
            state.lookupShortcutEnabled = isEnabled;
            showToast(isEnabled ? "Popup shortcut enabled" : "Popup shortcut disabled");
        }).catch((error) => {
            console.error("Quick Lookup failed to toggle shortcut state.", error);
        });
        return;
    }

    if (matchesShortcut(e, state.notebookHotkey)) {
        e.preventDefault();
        browser.runtime.sendMessage({
            type: "open-notebook"
        });
        return;
    }

    const { hotkey, selectedText } = state;

    if (!state.lookupShortcutEnabled) return;
    if (!selectedText) return;

    if (matchesShortcut(e, hotkey)) {
        e.preventDefault();
        browser.runtime.sendMessage({
            type: "save-and-lookup",
            word: selectedText
        });
    }
}, true);

loadUnderlineState().then(() => {
    ensureObserver();
    applyUnderlines();
}).catch((error) => {
    console.error("Quick Lookup failed to initialize underline state.", error);
});
