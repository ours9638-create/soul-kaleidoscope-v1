# 靈魂萬花筒｜App 2.8.0 Candidate

## Status

`2.8.0` completed UI-B integration in PR #10 and was merged into
`r3-runtime-foundation-closeout` on 2026-07-16. It has not been promoted to the
Cloudflare production branch or deployed.

- PR: `#10` — merged
- Merge commit: `3b56ead1bf594945e88d85a37b7aea51b614feb4`
- Release-readiness branch: `feature/release-2.8.0-readiness`

## Baseline

- R3 Final Closeout: `5a09a42559814fc3d7c871e0877396eee938c8e7`
- Engine: `2.2.1` unchanged
- Runtime Manifest, trusted registry, Published Datasets, formulas, case schema, and report model: unchanged

## Candidate scope

- Guided brand first screen with primary and secondary CTA.
- Approved four-function information architecture.
- Real cosmic and sacred-geometry source assets, optimized to WebP for delivery.
- Birth-data purpose and privacy notice.
- Collapsible system-status detail that opens automatically on application-data failure.
- Attributed Tabler line icons for persistent navigation and card affordances.
- Reproducible local static-preview command for browser QA.
- PWA asset existence validation and offline cache registration.
- App/PWA candidate version and cache namespace updated to `2.8.0`.

## Completed candidate QA

- Desktop 1365 × 768 and mobile 390 × 844 brand comparisons: PASS.
- Core form, result tabs, annual interpretation, Kaleidoscope verification and report-open flows: PASS.
- Application-origin browser Console review: PASS.
- Mobile labelling, alt text, 44 px target size and horizontal-overflow review: PASS.
- Desktop/mobile system-status disclosure and failure-state safeguard: PASS.
- Declared Node.js 24.16.0 / npm 11.13.0 build: PASS — GitHub Actions Calculator CI `29490443538`.
- Design QA: `design-qa.md` — `final result: passed`.

## Required before release

- Complete the G1 release-readiness checklist in `RELEASE_2.8.0_READINESS.md`.
- Complete iPhone Safari, installed PWA, offline-cache and PDF-save checks.
- Review promotion from `r3-runtime-foundation-closeout` to the configured
  Cloudflare production branch `calculator-deploy-setup`.
- Obtain separate authorization for the promotion PR, merge and Cloudflare
  deployment.
