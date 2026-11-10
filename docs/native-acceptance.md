# Native acceptance evidence

Runtime candidate `architecture2-8e8fca9`, source
`8e8fca9bae97ba073b6aa6472a749e8c1a5e0b8b`, archive SHA-256
`51a7d9845c24c4e55b71f68011b41f7708317b2ca48555952a8cd62ba57da44f`.
Public SDK dev.2 supplies negotiated capabilities. All tests ran from a copied standalone
Plugin Tester with isolated HOME/profile, outside plugin/host source checkouts. Fake
resources only; no real process/terminal/software action was executed.

## Observed native behavior on integrated Tester8

- All five tabs and quick view rendered through the production host/renderer. Gallery
  SVG/app/file assets loaded. Forms included every field type and masked fake secrets.
  Output showed actual xterm ANSI output plus all conversation roles/tool summary.
- Native CmdG/T/F/O/L selected tabs. The table's Value header produced actual descending
  `parent,plain` and ascending `plain,parent` row order, beyond updating metadata.
- Selected-row target menu supported Right-arrow navigation; Child fixture selection
  emitted the exact `choose-target` row/target payload shown in the lifecycle log.
- Wide resizable dialog opened at 960px, Maximize expanded it to 1248px, and native Escape
  closed it.
- Lifecycle displayed the real SDK-resolved opaque payload text and immutable package
  root. Preparation deferral prevented a host reset; turning it off restored readiness
  without deleting data. The declared schema-1 initialization migration is idempotent.
- Real native menu-bar list measured 380×197 for two plugins; demo quick view 380×520.
  Down/Return on its fixture incremented the counter to one. Escape returned to list and
  hid it. Activating the main window caused actual blur dismissal.
- Production Settings applied dark Nord. Native page zoom changed 16→17.6→16px root font;
  Output conversation zoom independently persisted 1.1. Reduced motion set transitions
  to zero. Main 414px native viewport had no root/body horizontal overflow.

Screenshots retained locally in ignored `artifacts/native/`:
`final-native-quick-dark-nord.png`, `narrow-decorated-cell-before-fix.png`.
No screenshot was published remotely. A narrow primary-label readability issue was
reported to the host owner; its generic renderer correction is pending targeted final
snapshot verification. Profile isolation/restore is also a final targeted gate.

## Optional capability evidence

Two fake-host tests execute both rich conversation and plain-text fallback branches.
Both hosts advertise every required manifest capability; only the optional conversation
capability differs. Native current-host rendering exercised the rich branch. The fallback
is not claimed as separately rendered under a reduced native-host capability set.

## Final signed real Tester10 profile/layout checks

Real app launched outside checkouts, with no self-extractor windows. Original profile URL
namespace `adf328d7e2bd71d3e6ccf456` retained dark Nord, counter one and an actually persisted
`PROFILE_ONE_ONLY_MARKER` query. A second profile namespace `f41895465c0bdf5cc49333ef` had
white/default appearance, counter zero, Gallery and no marker. Returning to the original
profile restored its prior state. Profile-specific plugin data and renderer state are
therefore independently persistent.

At actual 414px native width, document/body measured 414px; the generic renderer's primary
`Declarative ` span measured 75px, with its supplemental chips hidden. This confirms the
corrected layout geometry. Exact signed Tester10 screenshots/AX were blocked by native
capture access despite granted Orca permissions; direct and alternative capture failed
as well. No final-10 screenshot or visual claim is substituted for that limitation.
Visible wide-inspector acceptance is also not claimed: the default embedded frame after
sidebar is below its @3xl breakpoint, even though inspector nodes exist in the DOM. Tool
summary/roles were observed; tool-detail expansion was not separately exercised.

Earlier native Tester8 screenshots and keyboard/quick-view/blur evidence are retained.
All own real-app Bun/launcher processes were confirmed absent after explicit Quit. No user
processes, terminal sessions, actual dotfiles or installed Toolbelt were changed.
