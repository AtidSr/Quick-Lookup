browser.runtime.onMessage.addListener(async (message) => {
    if (!message.word) return;

    const settings = await browser.storage.sync.get([
        "dictionary",
        "customUrl"
    ]);

    let finalUrl = "";

    switch (settings.dictionary) {
        case "longman":
            finalUrl = "https://www.ldoceonline.com/dictionary/" + encodeURIComponent(message.word);
            break;

        case "cambridge":
            finalUrl = "https://dictionary.cambridge.org/dictionary/english/" + encodeURIComponent(message.word);
            break;

        case "oxford":
            finalUrl = "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(message.word);
            break;

        case "custom":
            if (!settings.customUrl || !settings.customUrl.includes("{keyword}")) {
                console.warn("Custom URL missing or missing {keyword} placeholder.");
                return;
            }
            finalUrl = settings.customUrl.replace("{keyword}", encodeURIComponent(message.word));
            break;
    }

    browser.windows.create({
        url: finalUrl,
        type: "popup",
        width: 600,
        height: 700
    });
});