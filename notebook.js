const NOTEBOOK_KEY = "wordNotebook";
const DEFAULT_NOTEBOOK = `# Word Notebook

`;

const elements = {
    editor: document.getElementById("notebookEditor"),
    previewPane: document.getElementById("previewPane"),
    workbench: document.getElementById("workbench"),
    modeCard: document.getElementById("modeCard"),
    saveButton: document.getElementById("saveNotebookBtn"),
    exportButton: document.getElementById("exportNotebookBtn"),
    importButton: document.getElementById("importNotebookBtn"),
    importInput: document.getElementById("importFileInput"),
    editModeButton: document.getElementById("editModeBtn"),
    previewModeButton: document.getElementById("previewModeBtn"),
    singleLayoutButton: document.getElementById("singleLayoutBtn"),
    splitLayoutButton: document.getElementById("splitLayoutBtn"),
    status: document.getElementById("status")
};

let statusTimer;
let currentMode = "preview";
let currentLayout = "single";

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function applyInlineMarkdown(text) {
    let result = escapeHtml(text);
    result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
    result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return result;
}

function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inList = false;
    let inCodeBlock = false;
    let codeBuffer = [];
    let paragraph = [];

    function flushParagraph() {
        if (paragraph.length === 0) return;
        html.push(`<p>${applyInlineMarkdown(paragraph.join(" "))}</p>`);
        paragraph = [];
    }

    function closeList() {
        if (!inList) return;
        html.push("</ul>");
        inList = false;
    }

    function closeCodeBlock() {
        if (!inCodeBlock) return;
        html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        inCodeBlock = false;
        codeBuffer = [];
    }

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        const trimmed = line.trim();

        if (trimmed.startsWith("```")) {
            flushParagraph();
            closeList();
            if (inCodeBlock) {
                closeCodeBlock();
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            continue;
        }

        if (!trimmed) {
            flushParagraph();
            closeList();
            continue;
        }

        if (trimmed.startsWith(">")) {
            flushParagraph();
            closeList();
            html.push(`<blockquote>${applyInlineMarkdown(trimmed.slice(1).trim())}</blockquote>`);
            continue;
        }

        if (trimmed.startsWith("### ")) {
            flushParagraph();
            closeList();
            html.push(`<h3>${applyInlineMarkdown(trimmed.slice(4))}</h3>`);
            continue;
        }

        if (trimmed.startsWith("## ")) {
            flushParagraph();
            closeList();
            html.push(`<h2>${applyInlineMarkdown(trimmed.slice(3))}</h2>`);
            continue;
        }

        if (trimmed.startsWith("# ")) {
            flushParagraph();
            closeList();
            html.push(`<h1>${applyInlineMarkdown(trimmed.slice(2))}</h1>`);
            continue;
        }

        if (trimmed.startsWith("- ")) {
            flushParagraph();
            if (!inList) {
                html.push("<ul>");
                inList = true;
            }
            html.push(`<li>${applyInlineMarkdown(trimmed.slice(2))}</li>`);
            continue;
        }

        closeList();
        paragraph.push(trimmed);
    }

    flushParagraph();
    closeList();
    closeCodeBlock();

    return html.join("");
}

function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.classList.toggle("error", isError);

    if (statusTimer) {
        clearTimeout(statusTimer);
    }

    if (!isError) {
        statusTimer = setTimeout(() => {
            elements.status.textContent = "Notebook ready.";
            elements.status.classList.remove("error");
        }, 2500);
    }
}

function updatePreview() {
    const markdown = elements.editor.value || DEFAULT_NOTEBOOK;
    elements.previewPane.innerHTML = renderMarkdown(markdown);
}

function syncWorkbench() {
    const singleLayout = currentLayout === "single";

    elements.workbench.dataset.layout = currentLayout;
    elements.workbench.dataset.mode = singleLayout ? currentMode : "split";

    elements.singleLayoutButton.classList.toggle("active", singleLayout);
    elements.splitLayoutButton.classList.toggle("active", !singleLayout);

    elements.modeCard.classList.toggle("hidden", !singleLayout);

    elements.editModeButton.classList.toggle("active", currentMode === "edit");
    elements.previewModeButton.classList.toggle("active", currentMode === "preview");
    elements.editModeButton.setAttribute("aria-selected", String(currentMode === "edit"));
    elements.previewModeButton.setAttribute("aria-selected", String(currentMode === "preview"));

    if (currentMode === "preview" || !singleLayout) {
        updatePreview();
    }

    if (singleLayout && currentMode === "edit") {
        elements.editor.focus();
    }
}

function setMode(mode) {
    currentMode = mode;
    syncWorkbench();
}

function setLayout(layout) {
    currentLayout = layout;

    if (layout === "single") {
        // User asked for same-position mode to hide the editor first.
        currentMode = "preview";
    }

    syncWorkbench();
}

async function loadNotebook() {
    const stored = await browser.storage.local.get(NOTEBOOK_KEY);
    elements.editor.value = stored[NOTEBOOK_KEY] || DEFAULT_NOTEBOOK;
    updatePreview();
    setStatus("Notebook ready.");
}

async function saveNotebook(notebookContent) {
    await browser.storage.local.set({
        [NOTEBOOK_KEY]: notebookContent
    });
}

async function exportNotebook() {
    const content = elements.editor.value;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
        await browser.downloads.download({
            url,
            filename: "quick-lookup-word-notebook.md",
            saveAs: true
        });
        setStatus("Markdown export started.");
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
}

async function handleImport(file) {
    if (!file) return;

    try {
        const content = await file.text();
        elements.editor.value = content;
        updatePreview();
        await saveNotebook(content);
        setStatus("Notebook imported and saved.");
    } catch (error) {
        console.error("Failed to import notebook", error);
        setStatus("Could not import that markdown file.", true);
    } finally {
        elements.importInput.value = "";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadNotebook();

    elements.editor.addEventListener("input", () => {
        if (currentMode === "preview" || currentLayout === "split") {
            updatePreview();
        }
    });

    elements.saveButton.addEventListener("click", async () => {
        await saveNotebook(elements.editor.value);
        updatePreview();
        setStatus("Notebook saved.");
    });

    elements.exportButton.addEventListener("click", async () => {
        try {
            await exportNotebook();
        } catch (error) {
            console.error("Failed to export notebook", error);
            setStatus("Could not export the notebook.", true);
        }
    });

    elements.importButton.addEventListener("click", () => {
        elements.importInput.click();
    });

    elements.importInput.addEventListener("change", async (event) => {
        const [file] = event.target.files;
        await handleImport(file);
    });

    elements.editModeButton.addEventListener("click", () => {
        setMode("edit");
    });

    elements.previewModeButton.addEventListener("click", () => {
        setMode("preview");
    });

    elements.singleLayoutButton.addEventListener("click", () => {
        setLayout("single");
    });

    elements.splitLayoutButton.addEventListener("click", () => {
        setLayout("split");
    });

    syncWorkbench();
});
