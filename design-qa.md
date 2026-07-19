# UI-B Design QA

## Comparison target

- Source visual truth: `calculator-deploy/docs/qa/brand-style-board.jpg` (web-optimized copy of the user-supplied brand board)
- Source role: approved Soul Kaleidoscope brand/style board. It defines art direction, palette, typography, imagery and interface language; it is not a pixel-exact desktop page specification.
- Desktop implementation screenshot: `calculator-deploy/docs/qa/desktop-1365x768.jpg`
- Mobile implementation screenshot: `calculator-deploy/docs/qa/mobile-390x844.jpg`
- Desktop full-view comparison: `calculator-deploy/docs/qa/desktop-brand-comparison.jpg`
- Mobile focused comparison: `calculator-deploy/docs/qa/mobile-brand-comparison.jpg`
- Approved collapsed system-status desktop state: `calculator-deploy/docs/qa/system-status-collapsed-desktop.jpg`
- Approved collapsed system-status mobile state: `calculator-deploy/docs/qa/system-status-collapsed-mobile.jpg`

## Viewports and states

- Desktop: requested 1365 × 768 initial state, showing the hero, four analysis entries and persistent navigation. The cloud browser rendered the same desktop breakpoint at 1363 CSS px; the evidence crop was normalized by approximately 1.2% to 1365 × 768 without changing layout or content.
- Mobile: exact 390 × 844 iframe layout viewport, initial state, with no horizontal overflow. The browser capture harness scaled the frame for capture and restored the evidence to 390 × 844.
- Theme: dark cosmic theme, App 2.8.0, Engine 2.2.1.
- Data state for functional QA: neutral Mock Data `QA 測試`, 1991-09-14 10:30, query date 2026-07-16. No real client data was used or stored.

## Findings

- No actionable P0, P1, P2 or P3 issue remains after the approved system-status refinement.
- The previous P3 density concern is resolved: engine, model and Dataset versions remain available inside a native disclosure without competing with the primary CTA.

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
- System status is collapsed by default after a successful 29/29 self-test, opens and closes through the native disclosure on desktop and mobile, and automatically opens when required application data is unavailable.
- Browser Console: no warning or error from the local application origin on calculator, mobile or report pages. Browser-extension-only messages were excluded.
- Accessibility checks: `zh-Hant`, one main landmark, named navigation, labelled form fields, named controls, native keyboard-operable disclosure, alt attributes on all images, no horizontal overflow at 390 px, and no visible interactive target smaller than 44 × 44 px after fixes.

## Comparison history

| Iteration | Finding | Fix | Post-fix evidence |
| --- | --- | --- | --- |
| 1 | P2 — hero title appeared near-white instead of the board's gold brand title | Mapped `.hero h1` to `--gold-light` | Desktop and mobile final comparisons |
| 1 | P2 — persistent navigation used text symbols instead of a coherent line-icon set | Replaced symbols and card arrows with attributed Tabler library SVG assets | Desktop and mobile final comparisons |
| 1 | P2 — auto-lunar action and result tabs measured 41–42 px high on mobile | Added a 44 px minimum interactive height | Second accessibility pass: no undersized visible targets |
| 2 | No P0/P1/P2 difference remained | No further blocking fix required | Final comparison images listed above |
| 3 | User approved the visual direction and requested less technical density on the hero | Moved engine, version and Dataset detail into a native disclosure; kept failure auto-open behavior | Collapsed desktop/mobile screenshots and disclosure interaction checks |

## Open questions

- Visual direction was approved by the user on 2026-07-16, including the instruction to collapse technical information.
- The exact release-toolchain build passed in GitHub Actions Calculator CI run `29490443538` under Node.js 24.16.0 and npm 11.13.0.

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
- [x] Collapsible system-status refinement and failure-state safeguard

## Follow-up polish

- None required for this approved refinement.

## Report stacked-layout refinement — 2026-07-16

- Reference: user-supplied report screenshot requesting the Gregorian and lunar groups to change from side-by-side columns to full-width rows stacked vertically.
- Desktop verification: cloud-browser report capture at 1363 CSS px with neutral QA data (`QA 測試`, 1991-09-23 11:17, query date 2026-07-16).
- Mobile verification: same report state inside an exact 390 × 844 layout frame.
- The two five-stage cards now render as 902 px full-width rows on desktop, with the Gregorian card above the lunar card. Both tables fit their desktop containers without an internal horizontal scrollbar.
- The two Soul Number structure cards now render as 902 px full-width rows on desktop, with four value columns per row; the mobile breakpoint keeps two value columns for readability.
- At 390 px, both card pairs remain vertically stacked and the page body has no horizontal overflow. The existing table-only horizontal scroll remains contained inside each five-stage table.
- Browser Console: no application-origin warning or error. Browser-extension-only metadata messages were excluded.
- No formula, Dataset, Runtime, report content or data-binding code changed.
- No actionable P0, P1 or P2 visual difference remains for this requested refinement.

final result: passed
