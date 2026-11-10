# Architecture v2 — SDK demonstrator

The cross-repository source of truth is Toolbelt `docs/architecture2.md` on the feature
branch. This repository owns the single removable first-party demonstrator. The host
bundles only a verified prebuilt archive; it contains no maintained demonstrator source.
All work stays on `feat/architecture2`, with main merges/stable releases requiring the
user's decision. Runtime code executes with user privileges; isolated profiles are not a
security sandbox. Never use the no-mistakes pipeline.
