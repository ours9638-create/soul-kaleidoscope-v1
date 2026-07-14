# Knowledge Release Pipeline

## Objective

Provide one auditable path from human-edited source material to runtime content without allowing drafts, Candidates, or unapproved Canonical drafts to leak into the App.

## Pipeline

```text
Google Drive source
→ source snapshot
→ normalized Candidate
→ schema validation
→ source and semantic diff
→ human review
→ approval record
→ CanonicalDraft
→ canonical schema test
→ Candidate/Canonical diff test
→ governance test
→ runtime-isolation test
→ explicit merge approval
→ Canonical
→ explicit runtime publication approval
→ Published manifest target
→ runtime asset generation
→ full CI and production build
→ Cloudflare deployment
→ iPhone/PWA/PDF acceptance
→ release record
```

## Responsibilities

### Source stage

- Preserve source file IDs, sheet/page/range, modified timestamp, and content hash when available.
- Never treat a newly modified file as authoritative solely because it is newer.

### Candidate stage

- Use stable record IDs and versioned schemas.
- Keep `reviewStatus: Candidate` and `autoPublish: false`.
- Do not overwrite prior Candidate versions.

### Review stage

- Record one decision per record: `Adopt`, `AdoptWithChanges`, `KeepCandidate`, `Conflict`, or `Rejected`.
- Record reviewer, date, source check, and required changes.

### CanonicalDraft stage

- Apply only approved changes.
- Keep Candidate evidence unchanged.
- Generate a machine-readable semantic diff.
- Keep `runtimePublishable: false` and `publishedTarget: null`.

### Canonical and publication stage

- Merge approval does not authorize runtime publication.
- Runtime publication requires a separate approval record.
- Only the Published manifest target may be loaded by runtime.
- Runtime must never fallback to Candidate, CanonicalDraft, Google Drive, or AI-generated text.

## Failure handling

- Schema failure: block the transition.
- Unexpected semantic diff: block the transition and review the affected records.
- Missing approval: block merge and publication.
- Runtime isolation failure: block the production build.
- Post-release defect: follow `CONTEXT_RULES_ROLLBACK.md`; do not edit the released Canonical file in place.

## Phase 6 release boundary

The Phase 6 Context Rules are approved for CanonicalDraft construction and testing only. Merge and runtime publication remain separately gated.