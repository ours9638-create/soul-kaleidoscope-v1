import { readFileSync } from "node:fs";

const canonicalPath = "data/knowledge/canonical/context-rules.phase6.v1.0.0.json";
const schemaPath = "schemas/context-rule-canonical.schema.json";
const approvalPath = "data/knowledge/approvals/context-rules.phase6.approval.2026-07-14.json";

const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const approval = JSON.parse(readFileSync(approvalPath, "utf8"));

const checks = [];
function check(name, actual, expected) {
  checks.push({ name, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) });
}
function checkTrue(name, condition, details = null) {
  checks.push({ name, actual: Boolean(condition), expected: true, details, pass: Boolean(condition) });
}

const expectedRecordIds = Array.from({ length: 14 }, (_, index) => `CTX-${String(index + 1).padStart(3, "0")}`);
const expectedBlockedIds = Array.from({ length: 6 }, (_, index) => `P6-BLOCK-${String(index + 1).padStart(3, "0")}`);
const changedRuleIds = ["CTX-002", "CTX-004", "CTX-011", "CTX-014"];
const adoptedRuleIds = ["CTX-001", "CTX-003", "CTX-005", "CTX-006", "CTX-007", "CTX-008", "CTX-009", "CTX-010", "CTX-012", "CTX-013"];
const expectedValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];

check("Canonical version", canonical.version, "1.0.0");
check("Canonical phase", canonical.phase, "Phase 6");
check("Canonical dataset id", canonical.datasetId, "context-rules");
check("Canonical lifecycle", canonical.lifecycleStatus, "CanonicalDraft");
check("Canonical review status", canonical.reviewStatus, "Canonical");
checkTrue("Canonical capture timestamp", Number.isFinite(Date.parse(canonical.capturedAt)), canonical.capturedAt);
checkTrue("Canonical approval timestamp", Number.isFinite(Date.parse(canonical.approvedAt)), canonical.approvedAt);
check("Canonical approval path", canonical.approvalRecord, approvalPath);

check("Canonical schema draft", schema.$schema, "https://json-schema.org/draft/2020-12/schema");
check("Canonical schema title", schema.title, "Soul Kaleidoscope Phase 6 Canonical Context Rule Dataset");
checkTrue("Canonical schema forbids top-level extras", schema.additionalProperties === false);
checkTrue("Canonical schema requires governance fields", ["lifecycleStatus", "approvedAt", "approvalRecord", "changeSet", "governance"].every((field) => schema.required.includes(field)));

check("Canonical record count", canonical.records.length, 14);
check("Canonical record IDs", canonical.records.map((record) => record.id), expectedRecordIds);
checkTrue("Canonical record IDs unique", new Set(canonical.records.map((record) => record.id)).size === canonical.records.length);
checkTrue("Canonical records use domain", canonical.records.every((record) => record.domain === "context-rule"));
checkTrue("Canonical records have status", canonical.records.every((record) => record.reviewStatus === "Canonical"));
checkTrue("Canonical records use version", canonical.records.every((record) => record.version === "1.0.0"));
checkTrue("Canonical records have valid review date", canonical.records.every((record) => Number.isFinite(Date.parse(record.lastReviewedAt))));
checkTrue("Canonical records have stable match keys", canonical.records.every((record) => record.matchKey?.type && record.matchKey?.key));
checkTrue("Canonical match keys unique", new Set(canonical.records.map((record) => `${record.matchKey.type}:${record.matchKey.key}`)).size === canonical.records.length);
checkTrue("Canonical records declare dependencies", canonical.records.every((record) => Array.isArray(record.dependsOn) && record.dependsOn.length > 0));
checkTrue("Canonical records declare rule contract", canonical.records.every((record) => record.rule?.summary && record.rule?.inputs?.length && record.rule?.outputs?.length && record.rule?.constraints?.length && record.rule?.interpretationBoundary));
checkTrue("Canonical records have at least two sources", canonical.records.every((record) => Array.isArray(record.sourceRefs) && record.sourceRefs.length >= 2));
checkTrue("Canonical records link approval", canonical.records.every((record) => record.governance?.approvedBy === "ours9638-create" && record.governance?.approvalRecord === approvalPath));
checkTrue("Canonical decisions are approved", canonical.records.every((record) => ["Adopt", "AdoptWithChanges"].includes(record.governance?.decision)));
check("Canonical Adopt IDs", canonical.records.filter((record) => record.governance.decision === "Adopt").map((record) => record.id), adoptedRuleIds);
check("Canonical AdoptWithChanges IDs", canonical.records.filter((record) => record.governance.decision === "AdoptWithChanges").map((record) => record.id), changedRuleIds);

check("Change-set candidate version", canonical.changeSet.candidateVersion, "0.1.0");
check("Change-set canonical version", canonical.changeSet.canonicalVersion, "1.0.0");
check("Change-set changed IDs", canonical.changeSet.changedRuleIds, changedRuleIds);
check("Change-set unchanged IDs", canonical.changeSet.unchangedRuleIds, adoptedRuleIds);
check("Change-set added IDs", canonical.changeSet.addedRuleIds, []);
check("Change-set removed IDs", canonical.changeSet.removedRuleIds, []);

check("Annual values", canonical.annualPositionMatrix.annualValues, expectedValues);
check("Position values", canonical.annualPositionMatrix.positionValues, expectedValues);
check("Annual-position count", canonical.annualPositionMatrix.recordCount, 81);
check("Annual-position interpretations empty", canonical.annualPositionMatrix.interpretations, null);
check("Annual-position generation disabled", canonical.annualPositionMatrix.autoGenerateInterpretations, false);
check("Annual-position runtime disabled", canonical.annualPositionMatrix.runtimePublishable, false);

check("Blocked scope count", canonical.blockedScopes.length, 6);
check("Blocked scope IDs", canonical.blockedScopes.map((item) => item.id), expectedBlockedIds);
checkTrue("Blocked scopes remain defined", canonical.blockedScopes.every((item) => item.scope?.trim() && item.reason?.trim()));

check("Manual approval required", canonical.governance.manualApprovalRequired, true);
check("Auto publish disabled", canonical.governance.autoPublish, false);
check("Runtime publish disabled", canonical.governance.runtimePublishable, false);
check("Merge approval closed", canonical.governance.mergeApproved, false);
check("Runtime publication approval closed", canonical.governance.runtimePublicationApproved, false);
check("Published target empty", canonical.governance.publishedTarget, null);
check("Candidate source retained", canonical.governance.candidateSource, "data/knowledge/candidates/context-rules.phase6.v0.1.json");
check("Review record retained", canonical.governance.reviewRecord, "data/knowledge/reviews/context-rules.phase6.review-template.json");
check("Governance approval record", canonical.governance.approvalRecord, approvalPath);
check("Governance approver", canonical.governance.approvedBy, "ours9638-create");

check("Approval candidate version", approval.candidateVersion, "0.1.0");
check("Approval canonical target", approval.canonicalVersion, "1.0.0-draft");
check("Approval changed IDs", approval.decisionSummary.changedRuleIds, changedRuleIds);
check("Approval runtime publication closed", approval.runtimePublicationApproved, false);
check("Approval merge closed", approval.mergeApproved, false);
check("Approval blocked scopes closed", approval.blockedScopesRemainClosed, true);

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Canonical context rule tests failed ${checks.length - failed.length}/${checks.length}.`);
  for (const item of failed) {
    const detail = item.details ? ` (${JSON.stringify(item.details)})` : "";
    console.error(`- ${item.name}: ${JSON.stringify(item.actual)} !== ${JSON.stringify(item.expected)}${detail}`);
  }
  process.exit(1);
}

console.log(`Canonical context rule tests passed ${checks.length}/${checks.length}.`);
console.log(`Validated ${canonical.records.length} CanonicalDraft rules, ${canonical.blockedScopes.length} blocked scopes, and closed merge/runtime publication gates.`);