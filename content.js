const NOTEBOOK_KEY = "wordNotebook";
const UNDERLINE_SETTING_KEY = "underlineStudiedWords";
const UNDERLINE_CLASS = "quick-lookup-studied-word";
const STYLE_ID = "quick-lookup-studied-style";
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
    underlineStudiedWords: false,
    studiedWords: [],
    observer: null,
    refreshTimer: null
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
}

function scheduleUnderlineRefresh() {
    if (state.refreshTimer) {
        clearTimeout(state.refreshTimer);
    }

    state.refreshTimer = setTimeout(() => {
        applyUnderlines();
    }, 120);
}

function ensureObserver() {
    if (state.observer || !document.body) return;

    state.observer = new MutationObserver((mutations) => {
        if (!state.underlineStudiedWords) return;

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
        browser.storage.sync.get([UNDERLINE_SETTING_KEY, "hotkey"]),
        browser.storage.local.get(NOTEBOOK_KEY)
    ]);

    if (syncSettings.hotkey) {
        state.hotkey = syncSettings.hotkey;
    }

    state.underlineStudiedWords = Boolean(syncSettings[UNDERLINE_SETTING_KEY]);
    state.studiedWords = parseStudiedWords(localSettings[NOTEBOOK_KEY] || "");
}

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
        if (changes.hotkey?.newValue) {
            state.hotkey = changes.hotkey.newValue;
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
});

document.addEventListener("keydown", (e) => {
    const { hotkey, selectedText } = state;

    if (!selectedText) return;

    const modifiersMatch =
        e.ctrlKey === hotkey.ctrl &&
        e.altKey === hotkey.alt &&
        e.shiftKey === hotkey.shift &&
        e.metaKey === hotkey.meta;

    const keyMatch = e.key.toLowerCase() === hotkey.key.toLowerCase();

    if (modifiersMatch && keyMatch) {
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
