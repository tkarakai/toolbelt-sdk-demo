# Toolbelt SDK Explorer

One removable plugin demonstrating the complete public Toolbelt SDK. It runs as a normal
prebuilt plugin package using the production renderer, host and lifecycle. No browser
JavaScript or custom React components are injected. All resources and interactions are
fixtures: the demo does not run shell commands, update software or control real processes.

Install the evaluation prerelease through Toolbelt's plugin manager, or open its archive in
Toolbelt Plugin Tester. Tabs: Gallery (`g`), Tables (`t`), Forms (`f`), Output (`o`),
Lifecycle (`l`), plus a menu-bar quick view. Host controls provide themes, zoom, resizing,
keyboard navigation and reduced motion. The plugin can be disabled or removed normally.
The host must preserve removal across app upgrades; this plugin never reinstalls itself.

## Develop and package

Bun 1.4.2: `bun install --frozen-lockfile`, `bun run typecheck`, `bun test`,
`bun run package`, `bun scripts/verify-package.ts`. The SDK is pinned to its immutable
`sdk-v0.2.0-dev.1` GitHub release asset. No Toolbelt source checkout is required.

The archive contains bundled JS, manifest and declared SVG asset. The package descriptor
binds the source commit, target, byte size and SHA-256. The host consumes these prebuilt
bytes; it must never build this source during app assembly. Current target darwin-arm64.

Schema 1 stores only a counter in the managed data directory. Same-schema upgrades are an
explicit no-op. Lifecycle can simulate unsafe preparation: enable Defer in Lifecycle,
attempt an upgrade/unload, observe the reason, then disable Defer and retry. This is a
fixture, not external work. Startup/ready and stop/persistence use the public SDK lifecycle.

See [coverage inventory](docs/coverage.md). Adding an SDK node without adding a scenario
fails TypeScript's exhaustive coverage map and the rendered-tree test. CI tests the actual
standalone archive without access to source files or ambient dependency directories.

Architecture work remains on `feat/architecture2`; stable release/main merges belong to
the user. This repository uses the same main PR/CI ruleset and pinned-action/security
policies as Toolbelt and the independent plugins.
