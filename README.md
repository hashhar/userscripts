# userscripts

Personal userscripts for sites I use often, plus a list of third-party userscripts I run.

## Scripts

| Script | Site | What it does |
|---|---|---|
| [claude-highlight-non-project-chats](claude-highlight-non-project-chats/) | claude.ai | Amber bar on non-project chats; per-project color bar + colored project name on project chats. |

## Other scripts I use

| Script | Site | What it does | Source |
|---|---|---|---|
| always-allow-selection | All sites | Forces text selection on sites that block it via CSS/JS. | [karlhorky/userscripts](https://github.com/karlhorky/userscripts/blob/main/userscripts/always-allow-selection.user.js) |
| GitHub hide green checks | GitHub | Hides the green check icons in PR/commit lists to reduce visual noise. | [losipiuk on OpenUserJS](https://openuserjs.org/scripts/losipiuk/Github_hide_green_checks) |
| GitHub PR expand, expand, expand! | GitHub | Auto-expands collapsed/large diffs in PRs. | [findepi on OpenUserJS](https://openuserjs.org/scripts/findepi/GitHub_PR_expand,_expand,_expand!) |
| Last.fm bulk edit | Last.fm | Adds bulk edit/delete for scrobbles. | [RudeySH/lastfm-bulk-edit](https://github.com/RudeySH/lastfm-bulk-edit) |
| MusicBrainz userscripts | MusicBrainz | Collection of MusicBrainz editing/navigation helpers. | [RustyNova016/MusicBrainz-UserScripts](https://github.com/RustyNova016/MusicBrainz-UserScripts) |

## Layout

```
<script-slug>/
├── <script-slug>.user.js
└── README.md          # site-specific gotchas, selectors, DOM notes
```

One folder per script. Folder name matches the script slug. See [`AGENTS.md`](./AGENTS.md) for conventions when writing or editing scripts.

