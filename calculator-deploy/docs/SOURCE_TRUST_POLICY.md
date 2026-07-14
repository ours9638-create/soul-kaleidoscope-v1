# Source Trust Policy

## Purpose

Every knowledge statement must carry traceable evidence. Trust levels classify the evidence source; they do not automatically approve content.

## Trust levels

| Level | Source class | Examples | Canonical eligibility |
|---|---|---|---|
| **A** | Primary formal source | official course material, signed rule document, approved canonical dataset | may enter human review |
| **B** | Verifiable technical source | formula workbook, Engine regression tests, schema contract, reproducible calculation | may support formulas, structures, and boundaries |
| **C** | Explicit user decision | dated approval record, formally confirmed terminology or interpretation boundary | may authorize a scoped decision when recorded |
| **D** | Historical or secondary source | legacy workbook, old notes, prior chat summary, copied reference material | cannot independently become Canonical |
| **E** | Inference or generated content | AI inference, unsourced synthesis, guessed mapping, auto-generated interpretation | prohibited from publication until independently sourced and approved |

## Evidence rules

- Formula rules should have at least one Level B source and, when semantics are user-defined, one Level C decision.
- Interpretation content should have a Level A source or a reviewed combination of Level A and Level C evidence.
- Level D sources may identify gaps or historical differences but cannot override Level A–C evidence.
- Level E content must be labeled `Pending` or remain absent; it must never be used as fallback runtime content.
- Conflicting sources require a conflict record. Recency alone does not determine authority.
- Source location must identify the file and section, page, sheet, range, commit, or test case.

## Source priority

When sources conflict, use this order only after confirming they address the same rule scope:

1. explicit approved user decision for the current project scope;
2. validated Engine contract and regression result for calculations;
3. official course source for interpretation content;
4. verifiable formula workbook;
5. historical files and prior summaries;
6. AI inference, which is never authoritative.

## Required source reference fields

- `sourceId`
- `sourceType`
- `trustLevel`
- `location`
- `section`
- optional `capturedAt`
- optional `contentHash`

Existing Phase 6 records predate the `trustLevel` field. They remain valid under the current schema, but the next schema revision must add this field before new knowledge domains are promoted to Canonical.