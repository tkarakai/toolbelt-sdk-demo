# Toolbelt SDK Explorer

SDK Explorer is a removable [Toolbelt](https://github.com/tkarakai/toolbelt) plugin showing
how to build declarative plugin interfaces with the public SDK. Its screens use the
production host and renderer. All resources are fixtures: it does not run shell commands,
update software, control user processes or change dotfiles.

## Install and use

In Toolbelt Settings → Plugins, enter `tkarakai/toolbelt-sdk-demo`, select a release and
approve execution. Enable prereleases when selecting a prerelease. You can also open the
built archive in Toolbelt Plugin Tester. Toolbelt can include this same prebuilt package
as its removable seed; the host preserves disable/removal choices across app upgrades.

The Gallery, Tables, Forms, Output and Lifecycle tabs have `g`, `t`, `f`, `o` and `l`
shortcuts, respectively. A menu-bar quick view shares the same counter and runtime.
Use host settings and controls for themes, zoom, resizing, keyboard navigation and reduced
motion. [Coverage](docs/coverage.md) maps public SDK features to their scenarios.

Lifecycle's Defer switch simulates an unsafe operation. Preparation reports a reason until
you turn it off, allowing authors to inspect the host's deferred-upgrade behavior. The
handoff counter is harmless: it counts an event rather than focusing an external app.

## Develop and verify

Use Bun 1.4.2 and run from the repository root:

```sh
bun install --frozen-lockfile
bun run typecheck
bun test
bun run package
bun scripts/verify-package.ts
```

The SDK dependency is pinned by public package URL and lockfile. No sibling Toolbelt
source checkout is required. See [architecture and authoring](docs/architecture.md) and
the shared [Toolbelt plugin authoring and update guide](https://github.com/tkarakai/toolbelt/blob/main/docs/plugins.md).
Use isolated tester profiles and disposable fixture data for visual and keyboard work.

`bun run build` writes `dist/package` with bundled plugin/migration JavaScript, manifest,
SVG asset, NOTICE and an opaque text payload. `bun run package` emits these files under
`artifacts/`:

- `toolbelt-sdk-demo-<version>-darwin-arm64.tar.gz`
- the archive's `.sha256` file
- `toolbelt-release.json`, binding repository, source commit, version, target, archive,
  byte size and SHA-256

## Publish and update

Follow the [release procedure](docs/releases.md) for release PRs, exact local checks,
artifact verification, draft uploads, publication and recovery. Builds and CI do not
publish releases. Published bytes are immutable; corrections require a new version.

Toolbelt downloads the prebuilt package and installs updates only after approval. It owns
compatibility checks, startup probes, snapshots and rollback; this plugin owns schema and
migration behavior. Schema 1 persists only a counter in its managed data directory.

When updating the SDK, pin the public asset URL, confirm the lockfile resolves that URL,
then update scenarios, coverage and tests for the changed API. Required capabilities must
be available before activation; optional features need an executable fallback based on
`Context.capabilities`. The host builds no source from this repository.
