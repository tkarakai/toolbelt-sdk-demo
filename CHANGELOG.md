# Changelog

## Unreleased
- Requires ToolBelt 0.6.0: SDK Explorer speaks plugin protocol 2 with SDK 0.4.0. Searches, filters, sorts and toolbar controls are now views kept by the SDK and saved by ToolBelt, so the person's choices come back after a restart, and AI agents read through views of their own that never change what you see. Dialogs show only for whoever opened them.
- Add a Views tab (`v`) that shows which view each screen is drawn for (yours or an agent's) and everything in it. It has a search, a Status filter that starts at Ongoing, filters that group the table (drag them, or use Group by, up to two levels), a sortable table with a starting sort and a Due choice control. Add label filter and Remove label filter change the declared filters, which demonstrates view controls that come from data.
- Declare agent access (`agent.access: read`): on Toolbelt with the agent interface, AI agents may read SDK Explorer's screens, with the Forms token masked. Lifecycle shows the setting. Older Toolbelt ignores it.

## 0.2.1 — 2026-11-24
- SDK Explorer is now a portable plugin with no macOS dependency. Its icon examples use lucide icons instead of Finder icons.

## 0.2.0 — 2026-11-23
- Demonstrate SDK 0.3.5: Markdown, date/time, color, combobox and tag-pill form fields, and a queue table with sections, unread rows cleared on selection, drag between sections and ⌥↑/⌥↓ moves. Requires Toolbelt 0.3.9.
- Demonstrate SDK 0.3.11 on hosts that support it, with plain-text fallbacks elsewhere: an editable option list (rename in place, add, paste several, drag or ⌥↑ ⌥↓, remove, a color per item) on Forms, a Status tag key coloring each value, a rainbow dot in the Gallery's hues, and a notes timeline with an add-note composer and in-place editing on Output. Still runs on Toolbelt 0.3.9.

## 0.1.1 — 2026-11-12
- Require Toolbelt 0.3.1 for explained toolbar controls and adopt source-pinned release retries with serialized publication.

- Demonstrate segmented toolbar choices with accessible labels and option explanations.

- Demonstrate column-bound group summaries alongside trailing nested-group summaries using SDK 0.3.1 (Toolbelt 0.2.2+).

## 0.1.0 — 2026-11-11
- Non-interactive release PR preparation and verified CI publication through the shared SDK release tooling.

- Add the removable SDK Explorer with all public UI nodes, field types, decorated tables,
  dialogs, quick view, packaged assets and lifecycle preparation examples.
- Produce self-contained verified release packages and a machine-checked coverage inventory.
- Demonstrate negotiated optional-capability fallback, opaque payload/path APIs, and retry-safe managed data initialization through a declared migration.
- Add an optional native handoff counter scenario and executable fallback using the public SDK dev.4 contract.
