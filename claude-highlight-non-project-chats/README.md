# claude-highlight-non-project-chats

A userscript that adds visual indicators to the Claude chat list at `https://claude.ai/recents` so non-project chats and project chats are distinguishable at a glance.

- **Non-project chats:** 3px solid amber bar (`#f59e0b`) running the full height of the row along its **left edge**.
- **Project chats:** 3px solid bar in the project's color along the **right edge**, plus the project name in the metadata strip rendered in the same color.
- **Color is a deterministic pure function of the project name** - same name always gets the same color, across reloads, machines, and userscript-manager instances. No persistence.

## Spec

The functional spec - *what* the script does, not *how*. Selectors, DOM structure, and CSS class names are implementation details.

### Scope

In scope: the full chat list view (currently `https://claude.ai/recents`).

Out of scope: the sidebar's "Recents" mini-list (does not surface project membership in the DOM, so detection isn't possible there); search results, individual chat views, project pages, and any other UI surface.

### Detection

For each chat row, classify it as one of:

1. **In a project** - the row visibly indicates membership in a project (typically by displaying a project name alongside the "last message" timestamp).
2. **Not in a project** - the row indicates no project membership.

Detection must rely on the same information a human reader uses to determine project membership from the row, not on any specific DOM structure. If the way Claude displays project membership changes, update detection to match the new visible signal.

If a row's project status cannot be determined (malformed, partially loaded, etc.), leave it untreated. Never guess.

### Treatment rules

- A row is exactly one of "in project" or "not in project" - never both.
- Indicators must remain visible during hover, focus, selection, and any other row state.
- Indicators must not break or visually overlap existing row affordances (the more-options button on the right, the selection checkbox on the left, etc.).

### Color assignment

- Project colors are dark-mode-friendly hues distributed around the color wheel.
- Assignment from project name to color must be **deterministic and stable** across page loads, navigations, and re-renders. Same project, same color, always.
- The hue range used must exclude amber and any nearby yellow/orange.
- Hash collisions across projects are acceptable. Don't over-engineer collision avoidance.

### Dynamic behavior

The chat list updates without full page reloads (initial load, client-side navigation, infinite scroll, mutations to existing rows). The script keeps treatments correct as the DOM changes.

Re-evaluation should be efficient enough but **simplicity beats cleverness here** - re-processing all rows on each mutation batch is fine. This is a userscript; readability and maintenance rank higher than aggressive caching.

### Non-goals

- **Not a triage tool.** The amber bar is informational, not a nudge to organize chats.
- **No text labels.** Don't re-add a "no project" suffix to the metadata line - earlier iteration, removed.
- **No persisted state.** Color assignments are recomputed each time from the deterministic mapping.
- **No interactivity.** Indicators are passive markers.

### Constraints

- Must run as a userscript (Tampermonkey / Violentmonkey compatible).
- Must not interfere with Claude's existing functionality - no hijacked clicks, no removed elements, no modified text content. Treatments are added via injected styles and DOM marker attributes only; original DOM remains intact.
- Must be safe against re-runs - applying the script twice produces the same result as applying it once.
- No external network requests, no analytics, no dependencies. Self-contained.
- Wrapped in an IIFE with `'use strict'`. No global pollution.

## Maintenance

Tweakable constants at the top of the script:

- `AMBER_COLOR` - non-project accent color.
- `BAR_WIDTH` - edge bar width in pixels.
- `PROJECT_COLOR_COUNT` - number of distinct hue slots to pick from. Higher = more variety, lower = larger guaranteed gap between any two project colors. Default 12.
- `PROJECT_COLOR_SATURATION` / `PROJECT_COLOR_LIGHTNESS` - HSL S/L for generated project colors. Tuned for dark mode.
- `HUE_SKIP_START` / `HUE_SKIP_END` - degree range excluded from generated hues, so project colors can't collide with the amber orphan bar.

When Claude redesigns the chat list and the script stops working, the breakage will almost certainly be in the DOM selectors. They live as named constants at the top of the script (`TABLE_SELECTOR`, `ROW_SELECTOR`, `TIME_SELECTOR`) - re-derive them by inspecting the new DOM, keeping the spec's "rely on the same signal a human uses" rule in mind. Non-obvious implementation choices that aren't from the spec are commented inline in the script.
