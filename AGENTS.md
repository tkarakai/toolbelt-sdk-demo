# toolbelt-sdk-demo — notes for coding agents

Read [README.md](README.md), [docs/architecture.md](docs/architecture.md) and the current
[SDK coverage inventory](docs/coverage.md). This repository owns the removable SDK
Explorer plugin and its conformance scenarios.

## Workflow

- Never use the no-mistakes tool, plugin, skill or pipeline. Work directly.
- One agent per checkout. Stop and ask if unexpected edits appear.
- Work on the assigned feature branch. Never commit directly to `main`; use a PR and let
  CI pass. Main merges and stable publication require explicit user authorization. Do not
  enable auto-merge unasked.
- Add user-visible changes to `## Unreleased` in `CHANGELOG.md`. Feature PRs do not bump
  versions; use a release PR.
- Pin workflow actions to full SHAs and keep permissions minimal. Allowed actions are
  GitHub-owned actions, `oven-sh/setup-bun` and `zizmorcore/zizmor-action`.
- Preserve attribution, notices and release history.

## Implementation and validation

- Use Bun commands, not node/npm/yarn/pnpm or alternate test runners. CI uses Bun 1.4.2.
- Depend on the pinned public SDK package. Do not copy SDK source or import a host checkout.
- Keep every scenario harmless. Use fixture data and isolated profiles; do not control
  user processes/terminals, update actual software or modify real dotfiles.
- Maintain stable plugin/screen ids, manifest compatibility, declared assets and schema.
- Update scenarios, `COVERAGE`, inventory and tests together when using new SDK features.
  Optional capabilities require executable fallback behavior.
- Run `bun run typecheck`, `bun test`, `bun run package` and
  `bun scripts/verify-package.ts`. Use Toolbelt Plugin Tester for visual/keyboard/native
  surface work with disposable profiles.
- Archives must contain all runtime dependencies and payloads and run after extraction
  without source checkouts or ambient dependency directories.

Follow the [release procedure](docs/releases.md) for release PRs, validation, immutable assets,
draft verification, publication and recovery. Local build/package scripts and CI do not
publish releases.
