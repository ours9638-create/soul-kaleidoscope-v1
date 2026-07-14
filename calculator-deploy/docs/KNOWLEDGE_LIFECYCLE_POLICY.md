# Knowledge Lifecycle Policy

## Purpose

This policy defines the only permitted lifecycle for Soul Kaleidoscope knowledge datasets. It applies to number topics, positions, context rules, report sentences, visual geometry, oils, color systems, and future knowledge modules.

## Lifecycle states

1. **Draft** — working material; incomplete and not eligible for review or runtime use.
2. **Candidate** — normalized proposal with stable IDs and source references; never runtime-publishable.
3. **Reviewed** — human review completed, but unresolved changes or approval conditions may remain.
4. **CanonicalDraft** — approved content has been applied to a versioned dataset; requires schema, diff, governance, and isolation tests.
5. **Canonical** — authoritative knowledge version approved for release preparation; still not runtime-visible unless publication is separately approved.
6. **Published** — copied to the runtime-published path through an approved release manifest and validated by CI.
7. **Deprecated** — superseded but still available for compatibility and audit history.
8. **Archived** — retained for evidence and rollback; no new runtime consumers may use it.

## Required gates

| Transition | Required evidence |
|---|---|
| Draft → Candidate | stable IDs, source references, mapping record, no automatic publication |
| Candidate → Reviewed | per-record human decisions and review timestamp |
| Reviewed → CanonicalDraft | approval record, applied changes, candidate/canonical diff |
| CanonicalDraft → Canonical | schema test, semantic diff test, governance test, runtime-isolation test |
| Canonical → Published | explicit runtime publication approval, published target, release record, CI success |
| Published → Deprecated | replacement version and migration note |
| Deprecated → Archived | retention decision and rollback impact review |

## Non-negotiable rules

- Candidate files are immutable review evidence. Corrections create a new Candidate version.
- Canonical files are immutable after approval. Corrections create a new Candidate and a new Canonical patch or minor version.
- Merge approval and runtime publication approval are separate decisions.
- A successful CI run does not itself authorize publication.
- Google Drive is the human-editable source; runtime never reads Google Drive directly.
- AI-generated or inferred content cannot become Canonical without independent source evidence and explicit human approval.
- Application-layer datasets must not modify calculation formulas or Engine outputs.

## Versioning

- **Patch**: wording, metadata, or traceability correction that does not change matching behavior.
- **Minor**: new records, new approved fields, or compatible interpretation coverage.
- **Major**: rule semantics, match keys, calculation contracts, or incompatible schema changes.

## Phase 6 status

`context-rules.phase6.v1.0.0.json` is currently `CanonicalDraft`. Its merge and runtime publication gates remain closed.