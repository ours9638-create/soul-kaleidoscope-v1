# UI-B Design QA

## Comparison target

- Source visual truth: `calculator-deploy/docs/qa/brand-style-board.jpg` (web-optimized copy of the user-supplied brand board)
- Source role: approved Soul Kaleidoscope brand/style board. It defines art direction, palette, typography, imagery and interface language; it is not a pixel-exact desktop page specification.
- Desktop implementation screenshot: `calculator-deploy/docs/qa/desktop-1365x768.jpg`
- Mobile implementation screenshot: `calculator-deploy/docs/qa/mobile-390x844.jpg`
- Desktop full-view comparison: `calculator-deploy/docs/qa/desktop-brand-comparison.jpg`
- Mobile focused comparison: `calculator-deploy/docs/qa/mobile-brand-comparison.jpg`

## Viewports and states

- Desktop: requested 1365 × 768 initial state, showing the hero, four analysis entries and persistent navigation. The cloud browser rendered the same desktop breakpoint at 1363 CSS px; the evidence crop was normalized by approximately 1.2% to 1365 × 768 without changing layout or content.
- Mobile: exact 390 × 844 iframe layout viewport, initial state, with no horizontal overflow. The browser capture harness scaled the frame for capture and restored the evidence to 390 × 844.
- Theme: dark cosmic theme, App 2.8.0, Engine 2.2.1.
- Data state for functional QA: neutral Mock Data `QA 測試`, 1991-09-14 10:30, query date 2026-07-16. No real client data was used or stored.

## Findings

- No actionable P0, P1 or P2 issue remains after the second comparison.
- [P3] Technical engine detail is visually dense on the mobile hero.
  Location: `.hero__status-detail`.
  Evidence: the brand board keeps the first phone screen more atmospheric, while the implementation surfaces model and dataset versions before the first CTA.
  Impact: the detail is readable and does not block the task, but a future consumer mode could reduce its prominence.
  Follow-up: keep the current detail for traceability, or move it into an expandable system-status panel after user review.

## Required fidelity surfaces

- Fonts and typography: display headings use the existing Traditional Chinese serif stack and body copy uses the existing system/Noto Sans stack. The final gold title, uppercase English kicker, weights and line lengths follow the supplied board without clipped text.
- Spacing and layout rhythm: desktop hero and four-card grid are balanced; mobile collapses to one column and preserves readable gutters. Persistent navigation remains within the viewport and page bottom padding keeps content reachable.
- Colors and visual tokens: deep purple/navy/black foundation, warm gold highlights, silver/white supporting text and restrained violet glow match the approved palette. Contrast remains legible in both captures.
- Image quality and asset fidelity: the hero and background use the real optimized WebP cosmic/sacred-geometry assets. Bottom navigation and card arrows now use Tabler Icons 3.44.0 library assets with MIT attribution; no placeholder or text-glyph icons remain in these controls.
- Copy and content: brand name, value statement, four core entries, privacy notice and result labels are complete and consistent. Decorative sacred geometry is not described as a calculated Soul Kaleidoscope result.

## Interaction, console and accessibility evidence

- Primary `開始探索` CTA scrolls to the input section on mobile; persistent `首頁` returns to the hero.
- Gregorian birthday conversion produced lunar date 1991/08/07 and the non-leap-month notice.
- Calculation populated summary data, solar flow year `23/5`, lunar flow year `24/6`, five annual interpretation cards and eleven Kaleidoscope verification rows.
- Annual and Kaleidoscope tabs changed the visible result region correctly.
- `在新分頁開啟報告` opened a complete report for the Mock Data.
- Browser Console: no warning or error from the local application origin on calculator, mobile or report pages. Browser-extension-only messages were excluded.
- Accessibility checks: `zh-Hant`, one main landmark, named navigation, labelled form fields, named controls, alt attributes on all images, no horizontal overflow at 390 px, and no visible interactive target smaller than 44 × 44 px after fixes.

## Comparison history

| Iteration | Finding | Fix | Post-fix evidence |
| --- | --- | --- | --- |
| 1 | P2 — hero title appeared near-white instead of the board's gold brand title | Mapped `.hero h1` to `--gold-light` | Desktop and mobile final comparisons |
| 1 | P2 — persistent navigation used text symbols instead of a coherent line-icon set | Replaced symbols and card arrows with attributed Tabler library SVG assets | Desktop and mobile final comparisons |
| 1 | P2 — auto-lunar action and result tabs measured 41–42 px high on mobile | Added a 44 px minimum interactive height | Second accessibility pass: no undersized visible targets |
| 2 | No P0/P1/P2 difference remained | No further blocking fix required | Final comparison images listed above |

## Open questions

- User visual approval is still required before merge or deployment.
- The exact release-toolchain build under Node.js 24.16.0 and npm 11.13.0 remains a release gate, not a Design QA blocker.

## Implementation checklist

- [x] Desktop brand comparison
- [x] Mobile brand comparison
- [x] Primary CTA and persistent navigation
- [x] Form, lunar conversion and calculation
- [x] Result tabs, annual interpretations and Kaleidoscope verification
- [x] Report-open flow
- [x] App-origin Console inspection
- [x] Mobile accessibility and overflow checks
- [x] P0/P1/P2 fixes and second comparison

## Follow-up polish

- Consider a user-facing mode that collapses detailed engine/version status after visual approval.

final result: passed
