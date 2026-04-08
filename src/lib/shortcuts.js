export const DEFAULT_LOOKUP_SHORTCUT = {
    ctrl: false,
    alt: true,
    shift: false,
    meta: false,
    key: "Alt",
    display: "Alt"
};

export const DEFAULT_TOGGLE_LOOKUP_SHORTCUT = {
    ctrl: true,
    alt: true,
    shift: false,
    meta: false,
    key: "l",
    display: "Ctrl + Alt + L"
};

export const DEFAULT_NOTEBOOK_SHORTCUT = {
    ctrl: false,
    alt: true,
    shift: false,
    meta: false,
    key: "n",
    display: "Alt + N"
};

export function cloneShortcut(shortcut, fallback = DEFAULT_LOOKUP_SHORTCUT) {
    const source = shortcut || fallback;

    return {
        ctrl: Boolean(source.ctrl),
        alt: Boolean(source.alt),
        shift: Boolean(source.shift),
        meta: Boolean(source.meta),
        key: source.key || "",
        display: source.display || ""
    };
}

export function eventToShortcut(event) {
    const isModifierOnly = ["Control", "Shift", "Alt", "Meta"].includes(event.key);
    const shortcut = {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey,
        key: isModifierOnly ? "" : event.key,
        display: ""
    };

    const parts = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.meta) parts.push("Meta");
    if (!isModifierOnly) {
        parts.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
    }

    shortcut.display = parts.join(" + ");

    return {
        shortcut,
        isModifierOnly
    };
}
