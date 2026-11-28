# Public SDK coverage

`src/scenarios.ts` contains the scenario definitions and exhaustive
`Record<Node['type'], string>` map. Tests compare that map with rendered trees, exercise
field variants and events, and execute both optional-capability branches. Keep this
inventory synchronized with the pinned public SDK.

| SDK feature | Scenario and behavior |
| --- | --- |
| page, stack, card | Gallery and other screens: actions, summary, search/highlight, row/column direction, spacing and semantic tones |
| text, markdown, details, empty | Gallery: monospace, tones, headings/links/code/lists, label/value pairs and intentional empty state |
| stats | Gallery and quick view: values, hints, tones and relative timestamps |
| progress | Gallery and Lifecycle: determinate/indeterminate progress, start time and tones |
| list | Gallery icons/hues and quick view: title/subtitle, metadata/time, dots, actions and empty content |
| table columns | Tables: grow/minWidth, alignment, monospace, priority/optional visibility, sortable direction |
| table cells | Tables: string/number/null, subtitle, tone, dot, strong text, tags, marks, chips, badge, sparkline, time and icon |
| groups and nested rows | Tables: string/structured/nested groups, branch/tag/summary (column-bound and trailing), muted/icon, expanded children |
| inspector | Tables: sectioned details, copy controls, item actions/actionRow, statistics/trends and tones |
| target chooser | Tables: one action with parent/child fixture targets |
| row/bulk actions | Tables: inline/primary/disabled/group/key/destructive/confirmation patterns, row action subsets and selected rowIds |
| search/filter/sort | Tables: selected filters/counts/dots, highlights and actual filtered/sorted fixture rows, all from the SDK-owned view |
| views | Views: declared search, a multi-select Status filter whose declared start matches `Filter.default` (Ongoing), a sortable table with a declared sort, the Due `choice` control and filters arranged with `filter-arrange` that group rows (`group`, `groupDisabled` at two levels). The page shows `view.instance` and the whole view. `onView` logs changes. Dialogs are kept per instance |
| allowed values (`options`) | Views: Status and label filters and the Due control declare the values they take. An agent's view outside them is refused; a saved view loses them |
| refused views | Views: Lock view makes `onView` return `false` for every change there; the instance keeps its view, the host gets `refused`, and the card lists the refusals |
| sort in a card, clearing a sort | Actions: the fixture items table sits in a card with a declared sort the SDK fills; `sort` with `key: null` (agents, the host) shows items in the order they were added |
| views from data (`declare`) | Views: each active label kind is a declared filter. Add/Remove label filter call `ctx.declare()`; saved arrangements tolerate ids that came or went |
| declarations from data loaded in `start` | Views: label kinds are saved with the counter; `start` loads them and the SDK sends the new declarations before `ready` without a `declare()` call |
| instances | Every screen renders per instance. Tests open `person` and `agent:…` instances and check that an agent's view never changes the person's tree |
| per-instance hooks | Actions: `onOpen`/`onClose` fire for every instance of every surface; the Instances card lists them with their origin and counts opens and closes. A closed Actions copy takes its draft with it |
| action and form declarations (protocol 3) | `src/declarations.ts` declares every action id the trees and toasts use, with its effect (`describe` where the label isn't enough), and every form, including the Forms body's segmented control. Tests check that the fake host rejects nothing and that every declared id is used |
| effects | Actions: Show tip (`view`, this instance only), Add item (`write`), Open the SDK guide (`external` with `confirm`, says what it would open), Clear items (`destructive` with `confirm`) and Restore samples (`write`, `agent: false`) |
| forms | Actions: New item… opens a per-instance dialog with a draft form (`item-draft`, `view`) saved by Save (`write`); each item's row pane has an inline form (`item-pane`, `write`) that saves each field |
| results | Actions: Add item, Add three, Save, Open the SDK guide and bulk Mark done return `data`; Fail on purpose throws (the result's `error`); Decline returns `false` (not handled). The Results card shows the last event's id, surface, origin (with the agent's name), instance and outcome, and the last eight events |
| tags and navigation | Toasts, clipboard text and navigation sent while handling carry the event's id; Show on Views calls `ctx.navigate('views', {select: 't2'})` |
| split button (`ui.split-action`) | Actions: Add item ▾ Add three / New item… on a card; Copy title ▾ Copy id on rows |
| action `input` (`ui.composer`) | Actions: a row's Rename… asks for the new title (without `ui.composer` it isn't offered: the drawer's title renames) |
| row pane (`ui.row-pane`) | Actions: each fixture item edits in the drawer with an inline form whose title is a heading |
| choice control (`ui.choice-control`) | Views toolbar: Due with sections and descriptions, applied by the SDK as a page control |
| text field | Forms: placeholder, description and fake sensitive value |
| select/switch fields | Forms: options, value, description and toggles |
| environment field | Forms: selected and secret entries with editable fixture keys/values |
| rich fields (`ui.rich-fields`) | Forms: live-styled Markdown `textarea`, `datetime` with optional time, theme `color` swatches, freeform `combobox`, and `tags` pills with flag, lookup and freeform keys |
| sections, unread, drag (`ui.row-reorder`, `ui.row-select`) | Tables: a queue fixture with declared sections (empty text, collapsed Done, fixed and refusing sections, drop labels), unread rows cleared by `select`, and `reorder` moves between sections |
| modifier keys (`ui.modifier-keys`) | Tables queue: ⌥↑/⌥↓ move fixtures within a section and ⇧U marks one unread |
| option list (`ui.options-field`) | Forms: an `options` field with colors, reorder and fixture counts; edits keep keys/counts, key new items and color them with `leastUsedHue`. Fallback: a plain-text list |
| per-value tag colors, rainbow dots | Forms: a `tags` Status key with `TagKey.colors` and no `color` (rainbow key dot); Gallery hues: a `"rainbow"` dot with `ui.options-field` |
| timeline, composer (`ui.timeline`, `ui.composer`) | Output: dated Markdown notes with delete (X) and in-place edit (E), and a composer that adds a note. Fallback: plain text |
| segmented control | Forms: values and option icons; Tables toolbar: accessible scope label and option hover/focus explanations, its value kept in the view |
| dialog | Toolbar: title/description/children, wide/resizable/maximize behavior, a primary action and ToolBelt's own Cancel (`dialog-close`) |
| log | Output: timestamps, tones, follow, empty state and bounded event history |
| terminal | Output: ANSI fixture lines, append/follow/empty, text zoom and wrapping |
| conversation | Output: all four roles, author/time/Markdown, expandable tool name/input/output, empty and optional fallback |
| floating window (`ui.floating`) | ⌘J or its sidebar item: a `bar` with `suggestions` grouped Continue (`metaAt`) and Try (`meta`), whose composer asks; a `panel` with `subtitle` and icon `actions`, a conversation with a pinned composer, a form (stacked labels, page scroll), a 40-row list, and `busy` (a 3 s timer: sidebar spinner, then a dot). Required: the manifest's `floating` needs it |
| assets/icons | Gallery and Tables: lucide names, declared namespaced SVG |
| keyboard | Declared screen shortcuts, table P/T action keys and host navigation/menu/dialog patterns |
| badge/toast/clipboard | Toolbar and Lifecycle: number/string/null badge, toast action/payload, undo and fixture copy; Actions: Clear items' toast with Undo and a ⌘Z key (`ui.toast-key`, optional) |
| lifecycle | Startup/ready, preparation defer/retry, shutdown persistence and schema-1 initialization |
| data/package/payload | Managed counter, immutable packageRoot, payload text resolution and declared asset |
| main and quick surfaces | Seven screens and a compact view sharing the same runtime/counter |
| optional native handoff | Lifecycle's declared counter action, supported-host behavior and safe fallback |
| agent access (manifest `agent.access`) | Manifest declares `act`; Lifecycle shows it. Agents read every screen and act in copies of their own, the person approving as each effect requires. The Forms text field marked `sensitive` stays masked and isn't offered to them, nor is Restore samples (`agent: false`) |

The `ui.conversation` fallback uses plain text when negotiated support is absent.
The option list, rainbow dot and notes stay optional. A host that doesn't negotiate them gets a
plain-text list, no rainbow entry and plain-text notes.
The `native.handoff` fallback still counts the fixture event and explains the missing
handoff support. Capability tests advertise every required manifest capability and vary
only optional support. The demo does not perform external terminal focus or real updates.

For a new SDK feature, add its manifest declaration if needed, a visible scenario, event
handling/fallback and meaningful tests. Verify the extracted release archive and open it in
ToolBelt's plugin development mode for layout, keyboard, appearance and quick-view behavior.

SDK Explorer requires ToolBelt 0.10.0 (plugin protocol 3) and SDK 0.7.0 for action and form
declarations, results, event tags, per-instance hooks, refused views, allowed values and clearing a
sort. ToolBelt 0.6.0 and SDK 0.4.0 brought views, instances, grouping filters and the choice control.
Toolbar controls require Toolbelt 0.3.1 or newer and the published SDK containing page controls.
Rich fields, sections, unread rows, drag-to-reorder, select events and modifier keys require
Toolbelt 0.3.9 or newer and SDK 0.3.5. The option list and rainbow dots need Toolbelt 0.3.16
(SDK 0.3.11); the timeline and composer need a host advertising `ui.timeline` and `ui.composer`.
