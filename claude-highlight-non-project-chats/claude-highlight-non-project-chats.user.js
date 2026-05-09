// ==UserScript==
// @name         Claude - Highlight chats not in a project
// @namespace    https://github.com/hashhar/userscripts
// @version      0.1.0
// @description  Amber bar on non-project chats; per-project colored bar + colored project name on project chats.
// @match        https://claude.ai/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const AMBER_COLOR = '#f59e0b';
    const BAR_WIDTH = 3;

    // Project colors are HSL with fixed S/L (dark-mode-friendly) and the hue
    // chosen by colorFor below. See colorFor for how the slot/skip math works.
    const PROJECT_COLOR_COUNT = 12;
    const PROJECT_COLOR_SATURATION = 70;
    const PROJECT_COLOR_LIGHTNESS = 65;
    // Hue band to skip (degrees), covering the warm yellow→orange→amber range
    // so project colors can't collide visually with the orphan bar.
    const HUE_SKIP_START = 20;
    const HUE_SKIP_END = 70;

    const DEBOUNCE_MS = 150;
    const CHAT_LIST_PATH = '/recents';
    const MARK_ATTR = 'data-uc-claude-state';
    const PROJECT_VAR = '--uc-claude-project-color';
    const PNAME_ATTR = 'data-uc-claude-pname';
    const STYLE_ID = 'uc-claude-highlight-style';

    const TABLE_SELECTOR = 'table[data-cds="Table"]';
    const ROW_SELECTOR = `${TABLE_SELECTOR} tbody tr`;
    const TIME_SELECTOR = 'a[data-primary="true"] time[data-cds="RelativeTime"]';

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }
        const style = document.createElement('style');
        style.id = STYLE_ID;
        // Bars are absolutely-positioned pseudo-elements on the always-visible
        // chat-link cell (left bar) and more-options cell (right bar). Box-shadow
        // on `td:first-child` doesn't work because that cell collapses to 0 width
        // outside selection mode; box-shadow on cells with `rounded-*` curves into
        // an arc instead of a straight bar. Pseudo-elements ignore the cell's
        // border-radius and give a clean full-height slab.
        style.textContent = `
${TABLE_SELECTOR} tr[${MARK_ATTR}="orphan"] > td:nth-child(2),
${TABLE_SELECTOR} tr[${MARK_ATTR}="project"] > td:last-child {
    position: relative;
}
${TABLE_SELECTOR} tr[${MARK_ATTR}="orphan"] > td:nth-child(2)::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${BAR_WIDTH}px;
    background: ${AMBER_COLOR};
    pointer-events: none;
}
${TABLE_SELECTOR} tr[${MARK_ATTR}="project"] > td:last-child::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: ${BAR_WIDTH}px;
    background: var(${PROJECT_VAR}, transparent);
    pointer-events: none;
}
${TABLE_SELECTOR} [${PNAME_ATTR}] {
    color: var(${PROJECT_VAR}, inherit) !important;
}
`;
        document.head.appendChild(style);
    }

    function colorFor(name) {
        // FNV-1a 32-bit hash. Math.imul keeps the multiply in 32 bits.
        let h = 0x811c9dc5;
        for (let i = 0; i < name.length; i++) {
            h ^= name.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        // Map the hash to one of PROJECT_COLOR_COUNT evenly-spaced hue slots
        // laid out across (360° minus the amber skip band). Quantising into
        // slots (rather than using the full hue circle) guarantees a minimum
        // hue gap between any two distinct projects, so unrelated names can't
        // land on near-identical colors. Slots that fall past HUE_SKIP_START
        // are shifted forward by the skip width to jump over the amber band.
        const idx = (h >>> 0) % PROJECT_COLOR_COUNT;
        const skipSize = HUE_SKIP_END - HUE_SKIP_START;
        const step = (360 - skipSize) / PROJECT_COLOR_COUNT;
        const raw = idx * step;
        const hue = raw < HUE_SKIP_START ? raw : raw + skipSize;
        return `hsl(${hue}, ${PROJECT_COLOR_SATURATION}%, ${PROJECT_COLOR_LIGHTNESS}%)`;
    }

    function findProjectSpan(metaDiv, timeEl) {
        for (const child of metaDiv.children) {
            if (child === timeEl) {
                continue;
            }
            if (child.tagName === 'SPAN' && child.textContent.trim()) {
                return child;
            }
        }
        return null;
    }

    function clearProjectMarks(tr) {
        tr.style.removeProperty(PROJECT_VAR);
        const tagged = tr.querySelector(`[${PNAME_ATTR}]`);
        if (tagged) {
            tagged.removeAttribute(PNAME_ATTR);
        }
    }

    function processRow(tr) {
        const timeEl = tr.querySelector(TIME_SELECTOR);
        if (!timeEl) {
            return;
        }
        const metaDiv = timeEl.parentElement;
        if (!metaDiv) {
            return;
        }

        const projectSpan = findProjectSpan(metaDiv, timeEl);

        if (!projectSpan) {
            tr.setAttribute(MARK_ATTR, 'orphan');
            clearProjectMarks(tr);
            return;
        }

        const name = projectSpan.textContent.trim();
        const color = colorFor(name);

        tr.setAttribute(MARK_ATTR, 'project');
        tr.style.setProperty(PROJECT_VAR, color);

        // Ensure exactly the current span carries the marker (project may have been renamed).
        const previouslyTagged = tr.querySelector(`[${PNAME_ATTR}]`);
        if (previouslyTagged && previouslyTagged !== projectSpan) {
            previouslyTagged.removeAttribute(PNAME_ATTR);
        }
        projectSpan.setAttribute(PNAME_ATTR, 'true');
    }

    function onChatList() {
        return location.pathname === CHAT_LIST_PATH
            || location.pathname.startsWith(CHAT_LIST_PATH + '/');
    }

    function processAll() {
        if (!onChatList()) {
            return;
        }
        document.querySelectorAll(ROW_SELECTOR).forEach(processRow);
    }

    let scheduled = null;
    function schedule() {
        if (scheduled !== null || !onChatList()) {
            return;
        }
        scheduled = setTimeout(() => {
            scheduled = null;
            processAll();
        }, DEBOUNCE_MS);
    }

    injectStyle();
    processAll();

    new MutationObserver(schedule).observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
