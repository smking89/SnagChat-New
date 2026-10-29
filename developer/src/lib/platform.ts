const agent = typeof navigator === "undefined" ? "" : `${navigator.platform} ${navigator.userAgent}`;

export const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(agent);

/** The shortcut label matches the key that actually opens search on this platform. */
export const SEARCH_SHORTCUT = IS_MAC ? "⌘K" : "Ctrl K";
