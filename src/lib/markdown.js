function parseInlineSegments(text) {
    const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const [token] = match;

        if (match.index > lastIndex) {
            segments.push({
                type: "text",
                text: text.slice(lastIndex, match.index)
            });
        }

        if (token.startsWith("`")) {
            segments.push({
                type: "code",
                text: token.slice(1, -1)
            });
        } else if (token.startsWith("**")) {
            segments.push({
                type: "strong",
                text: token.slice(2, -2)
            });
        } else {
            segments.push({
                type: "em",
                text: token.slice(1, -1)
            });
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
        segments.push({
            type: "text",
            text: text.slice(lastIndex)
        });
    }

    return segments;
}

export function parseMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let inCodeBlock = false;
    let codeBuffer = [];
    let paragraph = [];
    let currentList = null;

    function flushParagraph() {
        if (paragraph.length === 0) return;
        blocks.push({
            type: "paragraph",
            segments: parseInlineSegments(paragraph.join(" "))
        });
        paragraph = [];
    }

    function closeList() {
        if (!currentList) return;
        blocks.push(currentList);
        currentList = null;
    }

    function closeCodeBlock() {
        if (!inCodeBlock) return;
        blocks.push({
            type: "code",
            text: codeBuffer.join("\n")
        });
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
            blocks.push({
                type: "blockquote",
                segments: parseInlineSegments(trimmed.slice(1).trim())
            });
            continue;
        }

        if (trimmed.startsWith("### ")) {
            flushParagraph();
            closeList();
            blocks.push({
                type: "heading",
                level: 3,
                segments: parseInlineSegments(trimmed.slice(4))
            });
            continue;
        }

        if (trimmed.startsWith("## ")) {
            flushParagraph();
            closeList();
            blocks.push({
                type: "heading",
                level: 2,
                segments: parseInlineSegments(trimmed.slice(3))
            });
            continue;
        }

        if (trimmed.startsWith("# ")) {
            flushParagraph();
            closeList();
            blocks.push({
                type: "heading",
                level: 1,
                segments: parseInlineSegments(trimmed.slice(2))
            });
            continue;
        }

        if (trimmed.startsWith("- ")) {
            flushParagraph();
            if (!currentList) {
                currentList = {
                    type: "list",
                    items: []
                };
            }

            currentList.items.push(parseInlineSegments(trimmed.slice(2)));
            continue;
        }

        closeList();
        paragraph.push(trimmed);
    }

    flushParagraph();
    closeList();
    closeCodeBlock();

    return blocks;
}
