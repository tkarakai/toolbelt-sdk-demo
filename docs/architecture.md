# SDK Explorer architecture

SDK Explorer is a normal independently packaged Toolbelt plugin. It demonstrates the
public SDK using declarative nodes rendered by Toolbelt's shared components. This
repository owns scenarios, state, migration, assets, payload and tests. Toolbelt owns
installation, process lifecycle, rendering and native surfaces.

## Source and package layout

| Path | Responsibility |
| --- | --- |
| `src/index.ts` | SDK definition, startup/readiness, persistence, preparation and shutdown |
| `src/scenarios.ts` | Scenario trees, fixture state, event handling and exhaustive node map |
| `src/migrate.ts` | Retry-safe schema-1 data initialization |
| `toolbelt.json` | Stable identity, compatibility, capabilities, screens, assets and migration |
| `assets/badge.svg` | Declared packaged icon |
| `payload/example.txt` | Harmless opaque payload resolved through SDK path APIs |
| `scripts/build.ts` | Bundle plugin/migration code and copy package files |
| `scripts/package.ts` | ustar archive, checksum and source-bound release descriptor |
| `scripts/verify-package.ts` | Execute an extracted archive in an isolated environment |
| `test/` | Coverage, events, sorting, migration and capability fallback tests |

The public `@toolbelt/sdk` dependency is pinned in `package.json` and `bun.lock`.
There are no source-relative imports from Toolbelt. The build bundles the SDK into the
plugin's JavaScript; consumers install a ready-to-run package without dependency resolution.

The archive root contains `toolbelt.json`, `index.js`, `migrate.js`, `NOTICE`, `assets/`
and `payload/`. `toolbelt-release.json` identifies the exact source commit, target archive,
size and SHA-256. Target compatibility is declared as `darwin-arm64`. Toolbelt validates
metadata and bytes, then starts code only after execution approval. Plugin code has the
user's privileges; process/profile isolation is not a security sandbox.

## Runtime and data

The SDK performs the protocol handshake and reports readiness after `start` completes.
Startup creates the managed data directory, reads the counter from `demo.json`, obtains
negotiated host capabilities and loads the text fixture through `payload()`. Package-root
and payload information are shown by the Lifecycle scenario.

Render functions cover `screen:gallery`, `screen:table`, `screen:forms`, `screen:output`,
`screen:lifecycle` and `quick`. Event handlers update fixture state and invalidate open
surfaces. Search/filter/sort affect the table's actual row set/order. The event log retains
up to 50 entries. Forms, dialogs, output and deferral are in-memory fixtures; only the
counter is persisted. Every event and shutdown writes the counter.

Preparation normally returns ready. The Defer switch makes it return `ready: false` with
a readable reason, demonstrating a safe retry boundary without external work. Shutdown
persists the counter and has no external resource to stop.

Schema 1's declared migration accepts initialization or the same schema. It writes a
zero counter only when `demo.json` is absent, preserving existing data when retried. It
reports progress and completion over the migration protocol. The host runs it on staged
managed data and owns transaction promotion/recovery; the migration does not alter files
or services outside that directory. Same-schema package updates are an explicit no-op.

## Capability negotiation

Required capabilities are `ui.core`, `ui.action-key`, `ui.terminal`, `assets` and
`lifecycle`. Unknown/missing required support must reject activation before disturbing
an installed compatible package.

`ui.conversation` is optional. Output renders the conversation node when
`Context.capabilities` includes it and a plain-text explanation otherwise. Both branches
use actual scenario code and are tested with host capability sets that satisfy all
required manifest capabilities.

`native.handoff` is optional. The manifest declares the harmless `handoff-count` action.
A supporting native host can dismiss the popover before delivery; the plugin increments a
counter and shows a toast. Without support, the same action still counts safely and shows
an explicit fallback message. It never focuses a terminal or controls another process.

## Maintaining scenarios and authoring plugins

[coverage.md](coverage.md) is the current SDK-to-scenario inventory. `COVERAGE` is an
exhaustive `Record<Node['type'], string>` and tests traverse rendered trees to confirm every
node kind has a scenario. Adding a public node requires adding its scenario and inventory
entry. Changes to optional properties, fields, action patterns and capabilities need
corresponding fixtures and tests as well.

Use this authoring pattern:

1. Depend on a pinned public SDK package and declare a complete manifest with stable ids,
   compatibility, capabilities, assets, schema and screens.
2. Compute declarative trees inside the plugin process. Keep browser components and native
   behavior in the host; do not inject browser JavaScript/HTML/React.
3. Handle events through the SDK context and invalidate affected surfaces. Keep fixture
   resources and persisted data separate from host-owned renderer selection/scroll state.
4. Require capabilities whose absence prevents useful operation. Gate optional nodes and
   actions on negotiated support and implement a real fallback.
5. Make startup/probes and migrations safe to repeat. Declare data transitions explicitly;
   let the host stage/promote data, and defer preparation when work cannot safely stop.
6. Bundle dependencies and required payloads. Produce a complete archive with matching
   descriptor/checksums, then execute the extracted package without a source checkout.

Run typecheck, unit tests and clean-archive verification after changes. The archive check
uses all five screens and quick view, preparation deferral/retry and shutdown. Unit tests
cover node/field inventory, event behavior, row ordering, idempotent initialization and
both optional-capability branches. Use Toolbelt Plugin Tester for real rendering, mouse,
keyboard, dialogs, themes, zoom, narrow layouts, assets and native quick view. Every
scenario must remain safe with disposable resources.
