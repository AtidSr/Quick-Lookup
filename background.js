const NOTEBOOK_KEY = "wordNotebook";
const WORD_ANALYTICS_KEY = "wordAnalytics";
const NOTEBOOK_OPEN_MODE_KEY = "notebookOpenMode";
const LOOKUP_SHORTCUT_ENABLED_KEY = "lookupShortcutEnabled";
const SELECTION_POPUP_ENABLED_KEY = "selectionPopupEnabled";
const DEFAULT_NOTEBOOK = `# Word Notebook

`;
const DEFAULT_NOTEBOOK_OPEN_MODE = "popup";
const DEFAULT_LOOKUP_SHORTCUT_ENABLED = true;
const DEFAULT_SELECTION_POPUP_ENABLED = true;

function createWordEntry(word) {
    return `## ${word}

- Translation:
- Notes:

`;
}

function normalizeWord(word) {
    return word.trim().replace(/\s+/g, " ");
}

function capitalizeWord(word) {
    return word.replace(/\b([A-Za-z])([A-Za-z'-]*)\b/g, (_, first, rest) => {
        return first.toUpperCase() + rest.toLowerCase();
    });
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function notebookHasWord(notebook, word) {
    const headingPattern = new RegExp(`^##\\s+${escapeRegex(word)}\\s*$`, "gim");
    return headingPattern.test(notebook);
}

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

function normalizeAnalyticsWord(word) {
    return capitalizeWord(normalizeWord(word));
}

function startOfDayIso(timestamp) {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

function sanitizeAnalyticsRecord(word, record = {}) {
    const normalizedWord = normalizeAnalyticsWord(word);
    const lookupCount = Number.isFinite(record.lookupCount) && record.lookupCount > 0
        ? Math.floor(record.lookupCount)
        : 0;
    const createdAt = typeof record.createdAt === "string" && !Number.isNaN(Date.parse(record.createdAt))
        ? record.createdAt
        : record.firstLookupAt || new Date().toISOString();
    const firstLookupAt = typeof record.firstLookupAt === "string" && !Number.isNaN(Date.parse(record.firstLookupAt))
        ? record.firstLookupAt
        : createdAt;
    const lastLookupAt = typeof record.lastLookupAt === "string" && !Number.isNaN(Date.parse(record.lastLookupAt))
        ? record.lastLookupAt
        : firstLookupAt;

    return {
        word: normalizedWord,
        lookupCount,
        createdAt,
        createdDay: typeof record.createdDay === "string" && !Number.isNaN(Date.parse(record.createdDay))
            ? record.createdDay
            : startOfDayIso(createdAt),
        firstLookupAt,
        lastLookupAt
    };
}

async function getWordAnalytics() {
    const stored = await browser.storage.local.get(WORD_ANALYTICS_KEY);
    return stored[WORD_ANALYTICS_KEY] || {};
}

async function setWordAnalytics(analytics) {
    await browser.storage.local.set({
        [WORD_ANALYTICS_KEY]: analytics
    });
}

async function syncAnalyticsWithNotebook(notebookContent, existingAnalytics) {
    const analytics = existingAnalytics || await getWordAnalytics();
    const notebookWords = [...new Set(parseStudiedWords(notebookContent).map(normalizeAnalyticsWord))];
    const nextAnalytics = {};

    for (const word of notebookWords) {
        nextAnalytics[word] = sanitizeAnalyticsRecord(word, analytics[word]);
    }

    await setWordAnalytics(nextAnalytics);
    return nextAnalytics;
}

async function recordWordLookup(word, wasNewWord) {
    const analytics = await getWordAnalytics();
    const normalizedWord = normalizeAnalyticsWord(word);
    const now = new Date().toISOString();
    const existingRecord = sanitizeAnalyticsRecord(normalizedWord, analytics[normalizedWord]);
    const createdAt = wasNewWord ? now : existingRecord.createdAt;
    const nextRecord = {
        ...existingRecord,
        word: normalizedWord,
        lookupCount: existingRecord.lookupCount + 1,
        createdAt,
        createdDay: startOfDayIso(createdAt),
        firstLookupAt: existingRecord.lookupCount > 0 ? existingRecord.firstLookupAt : now,
        lastLookupAt: now
    };

    await setWordAnalytics({
        ...analytics,
        [normalizedWord]: nextRecord
    });
}

async function getNotebookContent() {
    const stored = await browser.storage.local.get(NOTEBOOK_KEY);
    return stored[NOTEBOOK_KEY] || DEFAULT_NOTEBOOK;
}

async function appendWordToNotebook(word) {
    const normalizedWord = normalizeWord(word);
    if (!normalizedWord) {
        return {
            word: normalizedWord,
            wasNewWord: false
        };
    }

    const capitalizedWord = capitalizeWord(normalizedWord);

    const currentNotebook = await getNotebookContent();
    if (notebookHasWord(currentNotebook, capitalizedWord)) {
        return {
            word: capitalizedWord,
            wasNewWord: false
        };
    }

    const separator = currentNotebook.endsWith("\n\n") || currentNotebook.length === 0 ? "" : "\n";
    const nextNotebook = `${currentNotebook}${separator}${createWordEntry(capitalizedWord)}`;

    await browser.storage.local.set({
        [NOTEBOOK_KEY]: nextNotebook
    });

    await syncAnalyticsWithNotebook(nextNotebook);

    return {
        word: capitalizedWord,
        wasNewWord: true
    };
}

async function buildLookupUrl(word) {
    const settings = await browser.storage.sync.get([
        "dictionary",
        "customUrl"
    ]);

    switch (settings.dictionary) {
        case "longman":
            return "https://www.ldoceonline.com/dictionary/" + encodeURIComponent(word);

        case "cambridge":
            return "https://dictionary.cambridge.org/dictionary/english/" + encodeURIComponent(word);

        case "oxford":
            return "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(word);

        case "custom":
            if (!settings.customUrl || !settings.customUrl.includes("{keyword}")) {
                console.warn("Custom URL missing or missing {keyword} placeholder.");
                return "";
            }
            return settings.customUrl.replace("{keyword}", encodeURIComponent(word));

        default:
            return "https://www.ldoceonline.com/dictionary/" + encodeURIComponent(word);
    }
}

async function openLookupPopup(word) {
    const finalUrl = await buildLookupUrl(word);
    if (!finalUrl) return;

    await browser.windows.create({
        url: finalUrl,
        type: "popup",
        width: 600,
        height: 700
    });
}

async function getNotebookOpenMode() {
    const storedSettings = await browser.storage.sync.get(NOTEBOOK_OPEN_MODE_KEY);
    return storedSettings[NOTEBOOK_OPEN_MODE_KEY] || DEFAULT_NOTEBOOK_OPEN_MODE;
}

async function openNotebookPage(openMode) {
    const targetMode = openMode || await getNotebookOpenMode();
    const notebookUrl = browser.runtime.getURL("notebook.html");

    if (targetMode === "tab") {
        await browser.tabs.create({
            url: notebookUrl
        });
        return;
    }

    await browser.windows.create({
        url: notebookUrl,
        type: "popup",
        width: 980,
        height: 780
    });
}

browser.runtime.onInstalled.addListener(async () => {
    const [notebook, syncSettings] = await Promise.all([
        browser.storage.local.get(NOTEBOOK_KEY),
        browser.storage.sync.get([
            NOTEBOOK_OPEN_MODE_KEY,
            LOOKUP_SHORTCUT_ENABLED_KEY,
            SELECTION_POPUP_ENABLED_KEY
        ])
    ]);

    if (!notebook[NOTEBOOK_KEY]) {
        await browser.storage.local.set({
            [NOTEBOOK_KEY]: DEFAULT_NOTEBOOK
        });
    }

    if (!syncSettings[NOTEBOOK_OPEN_MODE_KEY]) {
        await browser.storage.sync.set({
            [NOTEBOOK_OPEN_MODE_KEY]: DEFAULT_NOTEBOOK_OPEN_MODE
        });
    }

    if (!(LOOKUP_SHORTCUT_ENABLED_KEY in syncSettings)) {
        await browser.storage.sync.set({
            [LOOKUP_SHORTCUT_ENABLED_KEY]: DEFAULT_LOOKUP_SHORTCUT_ENABLED
        });
    }

    if (!(SELECTION_POPUP_ENABLED_KEY in syncSettings)) {
        await browser.storage.sync.set({
            [SELECTION_POPUP_ENABLED_KEY]: DEFAULT_SELECTION_POPUP_ENABLED
        });
    }

    await syncAnalyticsWithNotebook(notebook[NOTEBOOK_KEY] || DEFAULT_NOTEBOOK);
});

browser.action.onClicked.addListener(async () => {
    await openNotebookPage();
});

browser.runtime.onMessage.addListener(async (message) => {
    switch (message.type) {
        case "save-and-lookup":
            if (!message.word) return;
            {
                const result = await appendWordToNotebook(message.word);
                await recordWordLookup(result.word, result.wasNewWord);
            }
            await openLookupPopup(normalizeWord(message.word));
            return;

        case "open-lookup":
            if (!message.word) return;
            await openLookupPopup(normalizeWord(message.word));
            return;

        case "save-notebook":
            if (typeof message.notebookContent !== "string") return;
            await browser.storage.local.set({
                [NOTEBOOK_KEY]: message.notebookContent
            });
            await syncAnalyticsWithNotebook(message.notebookContent);
            return;

        case "get-word-analytics":
            return {
                analytics: await getWordAnalytics()
            };

        case "open-notebook":
            await openNotebookPage(message.openMode);
            return;

        case "set-lookup-shortcut-enabled":
            await browser.storage.sync.set({
                [LOOKUP_SHORTCUT_ENABLED_KEY]: Boolean(message.enabled)
            });
            return {
                enabled: Boolean(message.enabled)
            };

        case "toggle-lookup-shortcut-enabled": {
            const storedSettings = await browser.storage.sync.get(LOOKUP_SHORTCUT_ENABLED_KEY);
            const nextEnabled = !(storedSettings[LOOKUP_SHORTCUT_ENABLED_KEY] ?? DEFAULT_LOOKUP_SHORTCUT_ENABLED);
            await browser.storage.sync.set({
                [LOOKUP_SHORTCUT_ENABLED_KEY]: nextEnabled
            });
            return {
                enabled: nextEnabled
            };
        }

        default:
            return;
    }
});
