# UI-B Candidate Evidence

## Candidate identity

- Branch: `feature/ui-b-integration`
- R3 baseline: `5a09a42559814fc3d7c871e0877396eee938c8e7`
- Candidate version: `2.8.0`
- Engine version: `2.2.1` unchanged

## Collaboration state

- PR: `#10` — `UI-B: integrate Soul Kaleidoscope 2.8.0 brand experience`
- Base: `r3-runtime-foundation-closeout`
- Head: `feature/ui-b-integration`
- State: merged on 2026-07-16; undeployed
- Merge commit: `3b56ead1bf594945e88d85a37b7aea51b614feb4`

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
| Static source validation | PASS — 110/110 |
| Production build | PASS — App 2.8.0 / Engine 2.2.1 |
| Declared release toolchain | PASS — GitHub Actions Calculator CI `29490443538`; Node.js 24.16.0 / npm 11.13.0 |
| Local preview asset health | PASS — app, CSS, both optimized WebP assets and six Tabler SVG assets loaded; preview service healthy |
| Desktop browser rendering | PASS — normalized 1365 × 768 comparison |
| Mobile browser rendering | PASS — exact 390 × 844 layout viewport; no horizontal overflow |
| Core browser interactions | PASS — CTA/navigation, lunar conversion, calculation, result tabs, five annual cards, eleven Kaleidoscope rows and report-open flow |
| Browser Console | PASS — no application-origin warnings or errors |
| Accessibility checks | PASS — named controls, labelled fields, alt attributes and no visible target below 44 × 44 px |
| System-status disclosure | PASS — collapsed by default after success; disclosure works on desktop and mobile; load failure opens automatically |

## Runtime isolation

No changes were made to Runtime Loader, Trusted Dataset Registry, Runtime Manifest/schema, Published Datasets, formula engine, Profile Model, Report Model, or Kaleidoscope Model.

## Visual QA status

Browser-rendered Design QA is **PASS**. See repository-root `design-qa.md` and the durable evidence under `calculator-deploy/docs/qa/`.

The first pass found three P2 issues: near-white hero title, text-symbol navigation icons and 41–42 px mobile controls. They were corrected with the approved gold token, attributed Tabler library icons and 44 px minimum targets. After user visual approval, engine/version detail was moved into a native disclosure to reduce hero density while preserving traceability and automatic error visibility. The final comparison found no actionable P0/P1/P2/P3 issue.

## Release blockers

- Complete G1 physical-device, installed-PWA, offline-cache and PDF-save checks.
- Review the promotion diff against `calculator-deploy-setup`.
- Obtain separate authorization before promotion merge or Cloudflare deployment.

Local QA used Node.js 24.14.0 and npm 11.9.0. The declared release-toolchain gate was completed separately by the successful GitHub Actions Calculator CI run above.
