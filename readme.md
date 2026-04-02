# 🔍 Quick Dictionary Lookup (Firefox Extension)

A lightweight Firefox extension that lets you **select any word on a webpage** and instantly open a dictionary lookup in a popup window using a **customizable keyboard shortcut**.

You can choose between built‑in dictionaries (Longman, Cambridge, Oxford) or define your own custom URL pattern using `{keyword}` anywhere in the URL.

This project was built with the help of AI (Microsoft Copilot) to speed up development, improve code structure, and refine UI/UX design.

---

## ✨ Features

- 🔤 **Select a word and press your shortcut** to open a dictionary popup  
- ⌨️ **Customizable multi‑key shortcuts** (e.g., `Alt + Z`, `Shift + Enter`, `Ctrl + Alt + K`)  
- 📚 **Built‑in dictionary presets**  
  - Longman  
  - Cambridge  
  - Oxford  
- 🌐 **Custom dictionary mode**  
  - Use `{keyword}` anywhere in your URL  
  - Example:  
    ```
    https://example.com/search?q={keyword}
    ```
- 🎨 **Modern settings UI**  
  - Centered card layout  
  - Auto light/dark theme based on system settings  
- ⚡ Fast, simple, and privacy‑friendly

---

## 🛠 Installation (Temporary Add‑on)

1. Open Firefox  
2. Go to: `about:debugging#/runtime/this-firefox`  
3. Click **Load Temporary Add-on**  
4. Select your `manifest.json` file  

The extension will load immediately.

---

## ⚙️ Usage

### 1. Select a word  
Highlight any text on a webpage.

### 2. Press your shortcut  
Default: **Alt**

You can change this in the extension settings.

### 3. Dictionary popup opens  
The selected word is inserted into the dictionary URL.

---

## ⚙️ Custom Dictionary URL

In the settings page, choose **Custom** and enter a URL like:
https://example.com/search?q={keyword}


The extension will replace `{keyword}` with the selected word.

---

## ⌨️ Custom Shortcut

You can set any combination:

- Alt + Z  
- Shift + Enter  
- Ctrl + Shift + L  
- Meta + S (Mac)  
- F2, F3, etc.

Just click the shortcut field and press your desired keys.

---

## 🎨 Theme Support

The settings page automatically adapts to:

- Light mode  
- Dark mode  

based on your system or Firefox theme.

---

## 🤖 AI Assistance

This project was developed with the help of **Microsoft Copilot**, which assisted in:

- Designing the extension architecture  
- Writing and refactoring JavaScript  
- Improving the UI/UX  
- Implementing multi‑key shortcuts  
- Creating this README 

All code was reviewed and customized manually afterward.

---

## 📄 License

MIT License — feel free to modify and use this extension in your own projects.

---