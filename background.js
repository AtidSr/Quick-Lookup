const NOTEBOOK_KEY = "wordNotebook";
const DEFAULT_NOTEBOOK = `# Word Notebook

`;

function createWordEntry(word) {
    return `## ${word}

- Translation:
- Notes:

`;
}

async function getNotebookContent() {
    const stored = await browser.storage.local.get(NOTEBOOK_KEY);
    return stored[NOTEBOOK_KEY] || DEFAULT_NOTEBOOK;
}

async function appendWordToNotebook(word) {
    const trimmedWord = word.trim();
    if (!trimmedWord) return;

    const currentNotebook = await getNotebookContent();
    const separator = currentNotebook.endsWith("\n\n") || currentNotebook.length === 0 ? "" : "\n";
    const nextNotebook = `${currentNotebook}${separator}${createWordEntry(trimmedWord)}`;

    await browser.storage.local.set({
        [NOTEBOOK_KEY]: nextNotebook
    });
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

async function openNotebookPage() {
    await browser.tabs.create({
        url: browser.runtime.getURL("notebook.html")
    });
}

browser.runtime.onInstalled.addListener(async () => {
    const notebook = await browser.storage.local.get(NOTEBOOK_KEY);

    if (!notebook[NOTEBOOK_KEY]) {
        await browser.storage.local.set({
            [NOTEBOOK_KEY]: DEFAULT_NOTEBOOK
        });
    }
});

browser.action.onClicked.addListener(async () => {
    await openNotebookPage();
});

browser.runtime.onMessage.addListener(async (message) => {
    switch (message.type) {
        case "save-and-lookup":
            if (!message.word) return;
            await appendWordToNotebook(message.word);
            await openLookupPopup(message.word);
            return;

        case "open-notebook":
            await openNotebookPage();
            return;

        default:
            return;
    }
});
