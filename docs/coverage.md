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
| search/filter/sort | Tables: selected filters/counts/dots, highlights and actual filtered/sorted fixture rows |
| text field | Forms: placeholder, description and fake sensitive value |
| select/switch fields | Forms: options, value, description and toggles |
| environment field | Forms: selected and secret entries with editable fixture keys/values |
| segmented control | Forms: values and option icons; Tables toolbar: accessible scope label, option hover/focus explanations and field events |
| dialog | Toolbar: title/description/children, wide/resizable/maximize behavior, primary/cancel/close events |
| log | Output: timestamps, tones, follow, empty state and bounded event history |
| terminal | Output: ANSI fixture lines, append/follow/empty, text zoom and wrapping |
| conversation | Output: all four roles, author/time/Markdown, expandable tool name/input/output, empty and optional fallback |
| assets/icons | Gallery and Tables: lucide names, declared namespaced SVG and app/file Finder pathways |
| keyboard | Declared screen shortcuts, table P/T action keys and host navigation/menu/dialog patterns |
| badge/toast/clipboard | Toolbar and Lifecycle: number/string/null badge, toast action/payload, undo and fixture copy |
| lifecycle | Startup/ready, preparation defer/retry, shutdown persistence and schema-1 initialization |
| data/package/payload | Managed counter, immutable packageRoot, payload text resolution and declared asset |
| main and quick surfaces | Five screens and a compact view sharing the same runtime/counter |
| optional native handoff | Lifecycle's declared counter action, supported-host behavior and safe fallback |

The `ui.conversation` fallback uses plain text when negotiated support is absent.
The `native.handoff` fallback still counts the fixture event and explains the missing
handoff support. Capability tests advertise every required manifest capability and vary
only optional support. The demo does not perform external terminal focus or real updates.

For a new SDK feature, add its manifest declaration if needed, a visible scenario, event
handling/fallback and meaningful tests. Verify the extracted release archive and use the
production Plugin Tester for layout, keyboard, appearance and quick-view behavior.

Toolbar controls require Toolbelt 0.3.1 or newer and the published SDK containing page controls.
