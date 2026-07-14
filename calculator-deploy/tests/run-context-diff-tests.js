import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const candidatePath = "data/knowledge/candidates/context-rules.phase6.v0.1.json";
const canonicalPath = "data/knowledge/canonical/context-rules.phase6.v1.0.0.json";
const approvalPath = "data/knowledge/approvals/context-rules.phase6.approval.2026-07-14.json";
const reportPath = "data/knowledge/reports/context-rules.phase6.diff.generated.json";

const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
const approval = JSON.parse(readFileSync(approvalPath, "utf8"));

const changedRuleIds = ["CTX-002", "CTX-004", "CTX-011", "CTX-014"];
const expectedIds = Array.from({ length: 14 }, (_, index) => `CTX-${String(index + 1).padStart(3, "0")}`);
const candidateById = new Map(candidate.records.map((record) => [record.id, record]));
const canonicalById = new Map(canonical.records.map((record) => [record.id, record]));

function stable(value) {
  return JSON.stringify(value);
}
function semanticCore(record) {
  return {
    id: record.id,
    domain: record.domain,
    contextType: record.contextType,
    title: record.title,
    matchKey: record.matchKey,
    dependsOn: record.dependsOn,
    rule: record.rule
  };
}

const records = expectedIds.map((id) => {
  const before = candidateById.get(id);
  const after = canonicalById.get(id);
  const semanticChanged = stable(semanticCore(before)) !== stable(semanticCore(after));
  const expectedDecision = changedRuleIds.includes(id) ? "AdoptWithChanges" : "Adopt";
  return {
    id,
    existsInCandidate: Boolean(before),
    existsInCanonical: Boolean(after),
    stableIdentity:
      before?.domain === after?.domain &&
      before?.contextType === after?.contextType &&
      stable(before?.matchKey) === stable(after?.matchKey),
    semanticChanged,
    expectedSemanticChanged: changedRuleIds.includes(id),
    canonicalDecision: after?.governance?.decision ?? null,
    expectedDecision,
    pass:
      Boolean(before) &&
      Boolean(after) &&
      before.domain === after.domain &&
      before.contextType === after.contextType &&
      stable(before.matchKey) === stable(after.matchKey) &&
      semanticChanged === changedRuleIds.includes(id) &&
      after.governance?.decision === expectedDecision
  };
});

const candidateIds = candidate.records.map((record) => record.id);
const canonicalIds = canonical.records.map((record) => record.id);
const addedIds = canonicalIds.filter((id) => !candidateById.has(id));
const removedIds = candidateIds.filter((id) => !canonicalById.has(id));
const actualChangedIds = records.filter((record) => record.semanticChanged).map((record) => record.id);

const structuralChecks = {
  sameRecordIds: stable(candidateIds) === stable(canonicalIds),
  noAddedRecords: addedIds.length === 0,
  noRemovedRecords: removedIds.length === 0,
  changedIdsMatchApproval: stable(actualChangedIds) === stable(changedRuleIds),
  changeSetMatchesApproval:
    stable(canonical.changeSet.changedRuleIds) === stable(changedRuleIds) &&
    stable(canonical.changeSet.addedRuleIds) === stable([]) &&
    stable(canonical.changeSet.removedRuleIds) === stable([]),
  approvalMatchesCanonical:
    stable(approval.decisionSummary.changedRuleIds) === stable(changedRuleIds) &&
    approval.candidateVersion === candidate.version &&
    canonical.changeSet.candidateVersion === candidate.version,
  annualMatrixStructurePreserved:
    stable(candidate.annualPositionMatrix.annualValues) === stable(canonical.annualPositionMatrix.annualValues) &&
    stable(candidate.annualPositionMatrix.positionValues) === stable(canonical.annualPositionMatrix.positionValues) &&
    candidate.annualPositionMatrix.matchKeyFormat === canonical.annualPositionMatrix.matchKeyFormat &&
    candidate.annualPositionMatrix.recordCount === canonical.annualPositionMatrix.recordCount &&
    canonical.annualPositionMatrix.interpretations === null &&
    canonical.annualPositionMatrix.autoGenerateInterpretations === false,
  blockedScopesPreserved: stable(candidate.blockedScopes) === stable(canonical.blockedScopes),
  candidateRemainsCandidate:
    candidate.reviewStatus === "Candidate" &&
    candidate.records.every((record) => record.reviewStatus === "Candidate" && record.lastReviewedAt === null),
  canonicalIsNonPublishedDraft:
    canonical.lifecycleStatus === "CanonicalDraft" &&
    canonical.reviewStatus === "Canonical" &&
    canonical.governance.runtimePublishable === false &&
    canonical.governance.publishedTarget === null
};

const summary = {
  candidateVersion: candidate.version,
  canonicalVersion: canonical.version,
  recordCount: records.length,
  passedRecordDiffs: records.filter((record) => record.pass).length,
  changedRuleIds: actualChangedIds,
  addedRuleIds: addedIds,
  removedRuleIds: removedIds,
  structuralChecksPassed: Object.values(structuralChecks).filter(Boolean).length,
  structuralChecksTotal: Object.keys(structuralChecks).length,
  pass: records.every((record) => record.pass) && Object.values(structuralChecks).every(Boolean)
};

const report = {
  generatedAt: new Date().toISOString(),
  datasetId: "context-rules",
  candidatePath,
  canonicalPath,
  approvalPath,
  summary,
  structuralChecks,
  records
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!summary.pass) {
  console.error(`Context rule diff tests failed. Record diffs ${summary.passedRecordDiffs}/${summary.recordCount}; structural checks ${summary.structuralChecksPassed}/${summary.structuralChecksTotal}.`);
  for (const record of records.filter((item) => !item.pass)) {
    console.error(`- ${record.id}: semanticChanged=${record.semanticChanged}, expected=${record.expectedSemanticChanged}, decision=${record.canonicalDecision}, expectedDecision=${record.expectedDecision}`);
  }
  for (const [name, pass] of Object.entries(structuralChecks).filter(([, pass]) => !pass)) {
    console.error(`- ${name}: false`);
  }
  process.exit(1);
}

console.log(`Context rule diff tests passed. Record diffs ${summary.passedRecordDiffs}/${summary.recordCount}; structural checks ${summary.structuralChecksPassed}/${summary.structuralChecksTotal}.`);
console.log(`Approved semantic changes are limited to ${changedRuleIds.join(", ")}.`);
console.log(`Generated ${reportPath}.`);