# Context Rules Rollback Procedure

## Scope

This procedure applies to Phase 6 Context Rules after a Canonical or Published version has been created.

## Core rule

Never edit an approved Canonical or Published file in place. A defect creates a new correction cycle and a new version.

## Pre-publication rollback

When the current `CanonicalDraft` fails review or testing:

1. keep Candidate `0.1.0`, review record, approval record, and CanonicalDraft `1.0.0` unchanged;
2. create a correction Candidate with a new version;
3. record the defect and affected rule IDs;
4. repeat source review and human approval;
5. generate a new CanonicalDraft version;
6. rerun canonical, diff, governance, isolation, full regression, and build tests.

No runtime rollback is required because the Published target remains empty.

## Post-publication rollback

When a Published version causes a verified defect:

1. freeze further publication;
2. identify the last known-good Published version;
3. create an incident and rollback record;
4. repoint the Published manifest to the last known-good immutable asset;
5. run full CI and production build validation;
6. deploy and perform iPhone/PWA/report acceptance;
7. create a correction Candidate and follow the normal approval pipeline;
8. publish a patch or minor Canonical version only after separate approval.

## Required rollback record

- incident ID;
- detected date and reporter;
- affected dataset and version;
- affected record IDs;
- observed and expected behavior;
- last known-good version;
- rollback target and manifest change;
- test evidence;
- approver;
- deployment and acceptance evidence.

## Version rules

- Metadata or wording correction with unchanged matching behavior: patch version.
- New compatible records or interpretation coverage: minor version.
- Match-key, calculation contract, or incompatible schema change: major version.

## Prohibited actions

- editing Candidate history;
- editing Canonical or Published JSON in place;
- deleting Approval Records;
- using an unreviewed Candidate as emergency runtime fallback;
- reading Google Drive directly from runtime;
- replacing missing content with AI-generated inference;
- treating a successful deployment as evidence that the knowledge content is correct.

## Current Phase 6 position

`context-rules.phase6.v1.0.0.json` is a non-published CanonicalDraft. Its current rollback action is to stop promotion and open a correction Candidate; runtime remains unaffected.