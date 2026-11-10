# Public SDK coverage inventory

SDK: `@toolbelt/sdk` 0.2.0-dev.2, immutable public GitHub package. `COVERAGE` in
`src/scenarios.ts` is an exhaustive `Record<Node['type'], string>`; the test traverses real
scenario trees and compares all node kinds. All field variants are asserted separately.

| SDK capability | Scenario |
| --- | --- |
| page, stack row/column, card | Gallery and every screen; actions, summary, search/highlight, gap, semantic tones |
| text, markdown, details, empty | Gallery; mono text, all tones, headings/links/code/list; intentional empty state |
| stats | Gallery + quick; value, hints, tones, future/past relative timestamps |
| progress | Gallery determinate/indeterminate, start time, semantic tone; Lifecycle |
| list | Gallery icons/hues + quick; title/subtitle/meta/metaAt/dot/actions/empty |
| table columns | Tables; grow/minWidth, align, mono, priority/optional, sortable/sortDesc |
| decorated cells | Tables; string/number/null, sub/mono/tone/dot/strong/tags/marks/chips/badge/spark/at/icon |
| groups and nesting | Tables; string groups, id/label/strong/sub/tag/summary/muted/icon, open parent and children |
| row details/stats/targets | Tables; inspector sections/copy/dot/actions/actionRow, trends/tone, target chooser |
| table actions | Tables; inline/primary/disabled/checked/group/key/tone/confirm, row action subsets and bulk rowIds |
| search/filter/sort events | Tables; explicit selected filters/counts/dots, query highlighting, sort state |
| form text | Forms; placeholder/description/sensitive fake secret |
| form select/switch | Forms; options/value/description |
| form environment | Forms; selected/secret/editable fixture entries, description |
| segmented | Forms; values and option icons, field event |
| dialog | Toolbar; wide/resizable, title/description/children, primary/cancel actions, close event |
| log | Output; timestamps/tones/follow/empty, bounded event history |
| terminal | Output; ANSI colors, append/follow/empty, renderer text zoom |
| conversation | Output; all four roles, author/time/Markdown, tool name/detail and empty |
| assets/icons | Gallery/Table; lucide, declared namespaced SVG, app/file Finder icons |
| keyboard | Tab shortcut patterns g/t/f/o/l; row i/d/p/t keys, default navigation/menus |
| badge/toast/clipboard | Toolbar + Lifecycle; numeric/string/null badge, success toast with undo action/payload, copy |
| prepare/ready/stop | Lifecycle; startup handshake + ready, defer/retry reason, stop persistence |
| screens/quick | Five main-window screens plus shared compact quick view |
| package/data/payload boundary | Declared asset bundled; payload/packageRoot resolve harmless text fixture; schema-1 migration initializes managed data idempotently |

Optional capability fallback: this demonstrator requires every capability it exercises;
older hosts reject it before activation. Individual third-party plugins can put optional
capabilities in manifest.optional and gate those feature nodes based on negotiated host
support. The explorer's lifecycle deferral is explicit and retryable.

Validation: typecheck, six scenario/interaction/negotiation/migration tests and clean archive execution of all
five screens/quick plus preparation deferral/retry/shutdown pass locally. Host extraction
must use the exact strict production validator; visual/keyboard/theme/motion acceptance
requires Toolbelt Plugin Tester and remains a cross-repository integration gate.
