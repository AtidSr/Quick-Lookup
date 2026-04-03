# Quick Lookup Word Notebook

A lightweight Firefox extension that lets you select any word on a webpage, save it into a markdown notebook, and open a dictionary lookup with a customizable keyboard shortcut.

You can choose between built-in dictionaries (Longman, Cambridge, Oxford) or define your own custom URL pattern using `{keyword}` anywhere in the URL.

---

## Features

- Select a word and press your shortcut to save it into your notebook and open a dictionary popup
- Open a dedicated markdown notebook editor from the extension icon
- Export the notebook to a single `.md` file and import it later
- Customize multi-key shortcuts such as `Alt + Z`, `Shift + Enter`, or `Ctrl + Alt + K`
- Use built-in dictionary presets or a custom dictionary URL

---

## Installation

1. Open Firefox.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select `manifest.json`.

---

## Usage

### Save and lookup

1. Highlight a word on any webpage.
2. Press your shortcut.
3. The extension appends the word to the notebook and opens the configured dictionary popup.

### Edit the notebook

1. Click the extension icon.
2. Edit the markdown notebook in the editor tab.
3. Click **Save Notebook** to keep your changes inside the extension.

### Export or import markdown

- Click **Export Markdown** to save a `.md` copy anywhere you want on disk.
- Click **Import Markdown** to replace the current notebook with a markdown file you edited yourself.

---

## Notebook Format

Each saved word is appended using a simple, human-editable markdown block:

```md
## word

- Translation:
- Notes:
```

---

## Settings

Open the settings page to:

- choose the dictionary provider
- enter a custom URL pattern with `{keyword}`
- record a new activation shortcut

---

## License

MIT License
