# UI-B Integration Contract

## Purpose

Integrate the approved Soul Kaleidoscope visual direction and guided entry flow without changing the R3 Runtime trust model, calculation formulas, Published Dataset contents, report rules, or case storage semantics.

## Approved experience

1. Brand first screen communicates value within about ten seconds.
2. Primary CTA: `開始探索`.
3. Secondary CTA: `先了解分析內容`.
4. Four core entries remain: 靈魂數字、流年與位格、靈魂萬花圖、個案報告.
5. The profile form explains the purpose and privacy of birth data before input.
6. Decorative sacred geometry must never be presented as a calculated Soul Kaleidoscope result.

## Protected R3 boundary

The following are read-only during presentation-layer integration:

```text
calculator-deploy/src/runtime/runtime-manifest-loader.js
calculator-deploy/src/runtime/trusted-dataset-registry.js
calculator-deploy/src/runtime/feature-flags.js
calculator-deploy/schemas/runtime-manifest.schema.json
calculator-deploy/data/runtime/manifest.v1.json
calculator-deploy/data/sngl/numbers.v1.json
calculator-deploy/data/sngl/positions.v1.json
calculator-deploy/public/core.js
calculator-deploy/public/profile-model.js
calculator-deploy/public/report-model.js
calculator-deploy/public/kaleidoscope-model.js
```

Any future change to this list requires a separate commit, separate tests, and separate approval.

## Formal UI contract

### Required form and status IDs

```text
systemStatus
systemStatusDetail
calcForm
name
solarBirth
birthTime
queryDate
lunarYear
lunarMonth
lunarDay
lunarLeap
lunarAdjustNote
autoLunarBtn
calculateBtn
resetBtn
lookupNotice
```

### Required result and case hooks

```text
results
annualInterpretationList
annualInterpretationStatus
kaleidoscopeRows
kaleidoscopeStatus
copyKaleidoscopeBtn
caseSearch
caseList
saveNewCaseBtn
overwriteCaseBtn
deleteCaseBtn
exportCasesBtn
importCasesBtn
openReportBtn
toast
```

### Required behavior attributes

```text
data-result-tab
data-result-view
data-open-result-tab
```

HTML may be reorganized only if these IDs and behavior attributes retain their existing semantics.

## View-model rule

- Presentation code consumes `window.__SOUL_PROFILE__` and existing result renderers.
- Presentation code must not reimplement numerology, birthday state, annual position, Dataset approval, fallback, or report rules.
- The formal Kaleidoscope verification view continues to consume `SoulKaleidoscopeVisualModel`.
- Decorative brand imagery remains outside calculated result data and carries explicit non-result wording where ambiguity is possible.

## Allowed UI-B1 files

```text
calculator-deploy/public/index.html
calculator-deploy/public/brand-theme.css
calculator-deploy/public/results-ui.css
calculator-deploy/public/assets/*
```

## PWA integration files

The following may be changed only after UI assets and paths are final:

```text
calculator-deploy/build-calculator.js
calculator-deploy/public/sw.js
calculator-deploy/public/manifest.webmanifest
calculator-deploy/package.json
```

These changes must preserve R3 Runtime tests and add asset existence/cache validation.

## Regression requirement

After each implementation commit:

1. `npm test`
2. `npm --prefix calculator-deploy test`
3. `npm --prefix calculator-deploy run build`
4. Confirm no protected R3 file changed.
5. Confirm generated build outputs are not accidentally committed.

## Release boundary

Local commits are permitted. Push, PR, merge, Cloudflare deployment, Apps Script deployment, Runtime publication, and Dataset publication require separate explicit authorization.
