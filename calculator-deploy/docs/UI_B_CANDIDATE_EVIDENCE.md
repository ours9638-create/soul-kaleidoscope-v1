# UI-B Candidate Evidence

## Candidate identity

- Branch: `feature/ui-b-integration`
- R3 baseline: `5a09a42559814fc3d7c871e0877396eee938c8e7`
- Candidate version: `2.8.0`
- Engine version: `2.2.1` unchanged

## Local commits

| Commit | Scope |
| --- | --- |
| `7cd2dad` | Baseline evidence and integration contract |
| `0fb2b8f` | Guided brand entry, real visual assets, privacy context |
| `4aca42d` | Build validation and Service Worker caching for brand assets |
| `de91363` | App/PWA 2.8.0 candidate version |

No commit has been pushed, merged, or deployed.

## Verification after UI integration

| Gate | Result |
| --- | --- |
| Root test suite | PASS — 131/131 |
| Calculator regression | PASS — 86/86 |
| Core self-tests | PASS — 29/29 |
| Case store | PASS — 24/24 |
| Report model | PASS — 44/44 |
| Kaleidoscope model | PASS — 18/18 |
| Knowledge data | PASS — 28/28; auto-publish blocked as designed |
| Runtime Foundation existing | PASS — 43/43 |
| Runtime Foundation correction | PASS — 33/33 |
| Static source validation | PASS — 100/100 |
| Production build | PASS — App 2.8.0 / Engine 2.2.1 |
| Local HTTP asset health | PASS — index, CSS, both optimized WebP assets, manifest and Service Worker returned 200 |

## Runtime isolation

No changes were made to Runtime Loader, Trusted Dataset Registry, Runtime Manifest/schema, Published Datasets, formula engine, Profile Model, Report Model, or Kaleidoscope Model.

## Visual QA status

Browser-rendered comparison remains **BLOCKED** in the current environment because the selected cloud browser does not allow the local preview URL. Static tests and HTTP health checks do not replace visual QA.

Pending before push or PR:

1. 1365 × 768 comparison against the approved style board.
2. 390 × 844 mobile comparison.
3. Form, result tabs, annual result, Kaleidoscope verification and report-open interaction checks.
4. Browser Console and accessibility checks.
5. User visual approval.

## Release blockers

- Repeat release build with Node.js 24.16.0 and npm 11.13.0.
- Complete browser Design QA.
- Obtain separate authorization for push, PR, merge and Cloudflare deployment.
