import { readFileSync } from "node:fs";

const datasetPath = "data/knowledge/candidates/context-rules.phase6.v0.1.json";
const canonicalPath = "data/knowledge/canonical/context-rules.phase6.v1.0.0.json";
const schemaPath = "schemas/context-rule.schema.json";
const manifestPath = "data/knowledge/manifest.v1.json";
const reviewTemplatePath = "data/knowledge/reviews/context-rules.phase6.review-template.json";
const approvalPath = "data/knowledge/approvals/context-rules.phase6.approval.2026-07-14.json";

const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const reviewTemplate = JSON.parse(readFileSync(reviewTemplatePath, "utf8"));
const approvalRecord = JSON.parse(readFileSync(approvalPath, "utf8"));

const checks = [];
function check(name, actual, expected) {
  checks.push({ name, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) });
}
function checkTrue(name, condition, details = null) {
  checks.push({ name, actual: Boolean(condition), expected: true, details, pass: Boolean(condition) });
}

const allowedStatuses = new Set(["Pending", "Candidate", "Reviewed", "Rejected", "Conflict", "Canonical"]);
const allowedContextTypes = new Set([
  "number-chain", "calendar-role", "position-role", "annual-cycle", "birthday-switch",
  "weighting", "innate-frequency", "conditional-combination", "soul-level-link"
]);
const expectedDecisions = ["Adopt", "AdoptWithChanges", "KeepCandidate", "Conflict", "Rejected"];
const expectedRecordIds = Array.from({ length: 14 }, (_, index) => `CTX-${String(index + 1).padStart(3, "0")}`);
const expectedBlockedIds = Array.from({ length: 6 }, (_, index) => `P6-BLOCK-${String(index + 1).padStart(3, "0")}`);
const expectedValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const adoptedRuleIds = ["CTX-001", "CTX-003", "CTX-005", "CTX-006", "CTX-007", "CTX-008", "CTX-009", "CTX-010", "CTX-012", "CTX-013"];
const changedRuleIds = ["CTX-002", "CTX-004", "CTX-011", "CTX-014"];
const generatedMatchKeys = expectedValues.flatMap((annual) => expectedValues.map((position) => `annual:${annual}|position:${position}`));
const manifestEntry = manifest.datasets.find((item) => item.id === "context-rule");

check("Manifest platform", manifest.platform, "soul-kaleidoscope-knowledge");
check("Manifest runtime does not read Drive", manifest.sourceOfTruth.runtimeReadsGoogleDrive, false);
check("Manifest publication status gate", manifest.governance.publishableStatuses, ["Canonical"]);
check("Manifest requires manual approval", manifest.governance.manualApprovalRequired, true);
checkTrue("Manifest contains Phase 6 context-rule dataset", Boolean(manifestEntry));
check("Manifest context-rule domain", manifestEntry?.domain, "context-rule");
check("Manifest context-rule candidate path", manifestEntry?.candidate, datasetPath);
check("Manifest context-rule CanonicalDraft path", manifestEntry?.canonicalDraft, canonicalPath);
check("Manifest context-rule published target", manifestEntry?.published, null);
check("Manifest context-rule review status", manifestEntry?.reviewStatus, "Canonical");
check("Manifest context-rule lifecycle status", manifestEntry?.lifecycleStatus, "CanonicalDraft");
check("Manifest context-rule runtime approval", manifestEntry?.runtimePublicationApproved, false);
check("Manifest context-rule auto publish disabled", manifestEntry?.autoPublish, false);

check("Review record version", reviewTemplate.version, "0.2.0");
check("Review record dataset id", reviewTemplate.datasetId, "context-rules");
check("Review record candidate version", reviewTemplate.candidateVersion, dataset.version);
check("Review record status", reviewTemplate.reviewStatus, "Approved");
check("Review allowed decisions", reviewTemplate.allowedDecisions, expectedDecisions);
check("Review rule IDs", reviewTemplate.records.map((record) => record.id), expectedRecordIds);
check("Review decision count", reviewTemplate.records.filter((record) => Boolean(record.decision)).length, 14);
check("Review Adopt IDs", reviewTemplate.records.filter((record) => record.decision === "Adopt").map((record) => record.id), adoptedRuleIds);
check("Review AdoptWithChanges IDs", reviewTemplate.records.filter((record) => record.decision === "AdoptWithChanges").map((record) => record.id), changedRuleIds);
checkTrue("Review source checks verified", reviewTemplate.records.every((record) => record.sourceCheck === "Verified"));
checkTrue("Review required changes are arrays", reviewTemplate.records.every((record) => Array.isArray(record.requiredChanges)));
checkTrue("Changed rules contain required changes", reviewTemplate.records.filter((record) => changedRuleIds.includes(record.id)).every((record) => record.requiredChanges.length > 0));
check("Review reviewer", reviewTemplate.reviewer, "ours9638-create");
checkTrue("Review timestamp is valid", Number.isFinite(Date.parse(reviewTemplate.reviewedAt)), reviewTemplate.reviewedAt);
check("Review approval record path", reviewTemplate.approval.approvalRecord, approvalPath);
check("Review canonical draft target", reviewTemplate.approval.canonicalVersion, "1.0.0-draft");
check("Review approval flag", reviewTemplate.approval.approved, true);

check("Approval dataset id", approvalRecord.datasetId, "context-rules");
check("Approval candidate version", approvalRecord.candidateVersion, "0.1.0");
check("Approval canonical draft version", approvalRecord.canonicalVersion, "1.0.0-draft");
check("Approval reviewer", approvalRecord.reviewer, "ours9638-create");
checkTrue("Approval timestamp is valid", Number.isFinite(Date.parse(approvalRecord.reviewedAt)), approvalRecord.reviewedAt);
check("Approval Adopt IDs", approvalRecord.decisionSummary.adoptedRuleIds, adoptedRuleIds);
check("Approval changed IDs", approvalRecord.decisionSummary.changedRuleIds, changedRuleIds);
check("Approval kept candidate IDs", approvalRecord.decisionSummary.keptCandidateRuleIds, []);
check("Approval conflict IDs", approvalRecord.decisionSummary.conflictRuleIds, []);
check("Approval rejected IDs", approvalRecord.decisionSummary.rejectedRuleIds, []);
check("Approval runtime publication remains closed", approvalRecord.runtimePublicationApproved, false);
check("Approval merge remains closed", approvalRecord.mergeApproved, false);
check("Approval blocked scopes remain closed", approvalRecord.blockedScopesRemainClosed, true);

check("Schema draft", schema.$schema, "https://json-schema.org/draft/2020-12/schema");
check("Schema dataset title", schema.title, "Soul Kaleidoscope Phase 6 Context Rule Dataset");
checkTrue("Schema forbids unknown top-level fields", schema.additionalProperties === false);
checkTrue("Schema includes required Phase 6 fields", ["version", "phase", "datasetId", "reviewStatus", "capturedAt", "records", "annualPositionMatrix", "blockedScopes", "governance"].every((field) => schema.required.includes(field)));

check("Dataset version", dataset.version, "0.1.0");
check("Dataset phase", dataset.phase, "Phase 6");
check("Dataset id", dataset.datasetId, "context-rules");
check("Dataset review status", dataset.reviewStatus, "Candidate");
checkTrue("Dataset capture time is valid ISO date", Number.isFinite(Date.parse(dataset.capturedAt)), dataset.capturedAt);
check("Context rule record count", dataset.records.length, 14);
check("Stable sequential context rule IDs", dataset.records.map((record) => record.id), expectedRecordIds);
checkTrue("Context rule IDs are unique", new Set(dataset.records.map((record) => record.id)).size === dataset.records.length);
checkTrue("All context rules use the context-rule domain", dataset.records.every((record) => record.domain === "context-rule"));
checkTrue("All context types are allowed", dataset.records.every((record) => allowedContextTypes.has(record.contextType)));
checkTrue("All context rules remain Candidate", dataset.records.every((record) => record.reviewStatus === "Candidate"));
checkTrue("All context rule statuses are valid", dataset.records.every((record) => allowedStatuses.has(record.reviewStatus)));
checkTrue("All context rule versions are 0.1.0", dataset.records.every((record) => record.version === "0.1.0"));
checkTrue("Candidate rules remain unmodified by approval", dataset.records.every((record) => record.lastReviewedAt === null));
checkTrue("Every context rule has a title", dataset.records.every((record) => typeof record.title === "string" && record.title.trim().length > 0));
checkTrue("Every context rule has a stable match key", dataset.records.every((record) => record.matchKey?.type?.trim() && record.matchKey?.key?.trim()));
checkTrue("Context rule match keys are unique", new Set(dataset.records.map((record) => `${record.matchKey.type}:${record.matchKey.key}`)).size === dataset.records.length);
checkTrue("Every context rule declares dependencies", dataset.records.every((record) => Array.isArray(record.dependsOn) && record.dependsOn.length > 0));
checkTrue("Every context rule declares inputs", dataset.records.every((record) => Array.isArray(record.rule?.inputs) && record.rule.inputs.length > 0));
checkTrue("Every context rule declares outputs", dataset.records.every((record) => Array.isArray(record.rule?.outputs) && record.rule.outputs.length > 0));
checkTrue("Every context rule declares constraints", dataset.records.every((record) => Array.isArray(record.rule?.constraints) && record.rule.constraints.length > 0));
checkTrue("Every context rule defines an interpretation boundary", dataset.records.every((record) => record.rule?.interpretationBoundary?.trim()));
checkTrue("Every context rule has source references", dataset.records.every((record) => Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0));
checkTrue("Every source reference is traceable", dataset.records.every((record) => record.sourceRefs.every((source) => source.sourceId?.trim() && source.sourceType?.trim() && source.location?.trim() && source.section?.trim())));
checkTrue("Candidate records remain without embedded approval", dataset.records.every((record) => record.governance?.approvedBy === null && record.governance?.approvalRecord === null));
checkTrue("Every context rule contains governance notes", dataset.records.every((record) => record.governance?.notes?.trim()));

check("Annual values cover 1 through 9", dataset.annualPositionMatrix.annualValues, expectedValues);
check("Position values cover 1 through 9", dataset.annualPositionMatrix.positionValues, expectedValues);
check("Annual-position match key format", dataset.annualPositionMatrix.matchKeyFormat, "annual:<annual>|position:<position>");
check("Annual-position matrix record count", dataset.annualPositionMatrix.recordCount, 81);
check("Generated annual-position key count", generatedMatchKeys.length, 81);
checkTrue("Generated annual-position keys are unique", new Set(generatedMatchKeys).size === 81);
checkTrue("Generated annual-position keys match format", generatedMatchKeys.every((key) => /^annual:[1-9]\|position:[1-9]$/.test(key)));
check("Annual-position interpretations remain empty", dataset.annualPositionMatrix.interpretations, null);
check("Annual-position automatic generation disabled", dataset.annualPositionMatrix.autoGenerateInterpretations, false);
checkTrue("Candidate annual-position matrix is not Canonical", dataset.annualPositionMatrix.reviewStatus !== "Canonical");

check("Blocked scope count", dataset.blockedScopes.length, 6);
check("Stable blocked scope IDs", dataset.blockedScopes.map((item) => item.id), expectedBlockedIds);
checkTrue("Blocked scope IDs unique", new Set(dataset.blockedScopes.map((item) => item.id)).size === dataset.blockedScopes.length);
checkTrue("Blocked scopes have scope and reason", dataset.blockedScopes.every((item) => item.scope?.trim() && item.reason?.trim()));

check("Manual approval required", dataset.governance.manualApprovalRequired, true);
check("Automatic publication disabled", dataset.governance.autoPublish, false);
check("Published target empty", dataset.governance.publishedTarget, null);
check("Candidate approval record empty", dataset.governance.approvalRecord, null);
checkTrue("Candidate dataset is not publishable", dataset.reviewStatus !== "Canonical" && dataset.governance.autoPublish === false);

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Phase 6 context rule tests failed ${checks.length - failed.length}/${checks.length}.`);
  for (const item of failed) {
    const detail = item.details ? ` (${JSON.stringify(item.details)})` : "";
    console.error(`- ${item.name}: ${JSON.stringify(item.actual)} !== ${JSON.stringify(item.expected)}${detail}`);
  }
  process.exit(1);
}

console.log(`Phase 6 context rule tests passed ${checks.length}/${checks.length}.`);
console.log(`Validated ${dataset.records.length} immutable Candidate rules, ${generatedMatchKeys.length} structural annual-position keys, ${dataset.blockedScopes.length} blocked scopes, and ${reviewTemplate.records.length} approved decisions.`);
console.log("Manifest now registers a non-published CanonicalDraft; Runtime publication remains closed.");