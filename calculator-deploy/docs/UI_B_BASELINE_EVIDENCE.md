# UI-B0 Baseline Evidence

## Baseline

- R3 Final Closeout commit: `5a09a42559814fc3d7c871e0877396eee938c8e7`
- Remote branch: `r3-runtime-foundation-closeout`
- Integration branch: `feature/ui-b-integration`
- Commit subject: `fix(runtime): harden R3 manifest foundation`
- Parent commit: `1cb34438f3d3a8742c9bcfc79d22ebabb42e829e`
- Verification date: 2026-07-16

## Toolchain observation

| Item | Repository declaration | Verification environment |
| --- | --- | --- |
| Node.js | 24.16.0 | 24.14.0 |
| npm | 11.13.0 | 11.9.0 |

The baseline tests and build passed in the available environment. Release evidence must be repeated with the declared Node.js and npm versions before merge or deployment.

## Baseline results

| Gate | Result |
| --- | --- |
| Root test suite | PASS — 131/131 |
| Calculator regression | PASS — 86/86 |
| Core self-tests | PASS — 29/29 |
| Case store | PASS — 24/24 |
| Report model | PASS — 44/44 |
| Kaleidoscope model | PASS — 18/18 |
| Knowledge data | PASS — 28/28; auto-publish remains blocked |
| Runtime Foundation existing suite | PASS — 43/43 |
| Runtime Foundation correction suite | PASS — 33/33 |
| Static source validation | PASS — 96/96 |
| Production calculator build | PASS |

## Runtime boundaries confirmed

- Runtime manifest requires the exact `number-topic` and `position` Dataset set.
- Trusted Dataset Registry remains the external approval anchor.
- Candidate, mapping, source, diff report and Drive paths cannot authorize Runtime.
- Strict RFC3339 date validation is active.
- last-known-good updates only after a complete validated snapshot.
- Failed or incomplete snapshots use rollback or safe fallback without returning partial data.

## Generated build outputs

The production build generated the expected `public/lunar-data.js`, `public/sngl-data.js`, and knowledge diff report. These generated files were removed after verification so the UI-B integration worktree returned to a clean baseline.

## Gate result

UI-B0 baseline: **PASS with toolchain variance noted**.

UI work may proceed. Merge and deployment remain blocked until the declared Node.js/npm versions are used for release evidence.
