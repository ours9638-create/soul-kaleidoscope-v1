import { readFileSync } from "node:fs";

const datasetPath = "data/knowledge/candidates/context-rules.phase6.v0.1.json";
const schemaPath = "schemas/context-rule.schema.json";
const manifestPath = "data/knowledge/manifest.v1.json";
const reviewTemplatePath = "data/knowledge/reviews/context-rules.phase6.review-template.json";

const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const reviewTemplate = JSON.parse(readFileSync(reviewTemplatePath, "utf8"));

const checks = [];
function check(name, actual, expected) {
  checks.push({
    name,
    actual,
    expected,
    pass: JSON.stringify(actual) === JSON.stringify(expected)
  });
}

function checkTrue(name, condition, details = null) {
  checks.push({
    name,
    actual: Boolean(condition),
    expected: true,
    details,
    pass: Boolean(condition)
  });
}

const allowedStatuses = new Set(["Pending", "Candidate", "Reviewed", "Rejected", "Conflict", "Canonical"]);
const allowedContextTypes = new Set([
  "number-chain",
  "calendar-role",
  "position-role",
  "annual-cycle",
  "birthday-switch",
  "weighting",
  "innate-frequency",
  "conditional-combination",
  "soul-level-link"
]);
const expectedDecisions = ["Adopt", "AdoptWithChanges", "KeepCandidate", "Conflict", "Rejected"];
const expectedRecordIds = Array.from({ length: 14 }, (_, index) => `CTX-${String(index + 1).padStart(3, "0")}`);
const expectedBlockedIds = Array.from({ length: 6 }, (_, index) => `P6-BLOCK-${String(index + 1).padStart(3, "0")}`);
const expectedValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const generatedMatchKeys = expectedValues.flatMap((annual) =>
  expectedValues.map((position) => `annual:${annual}|position:${position}`)
);
const manifestEntry = manifest.datasets.find((item) => item.id === "context-rule");

check("Manifest platform", manifest.platform, "soul-kaleidoscope-knowledge");
check("Manifest runtime does not read Drive", manifest.sourceOfTruth.runtimeReadsGoogleDrive, false);
check("Manifest publication status gate", manifest.governance.publishableStatuses, ["Canonical"]);
check("Manifest requires manual approval", manifest.governance.manualApprovalRequired, true);
checkTrue("Manifest contains Phase 6 context-rule dataset", Boolean(manifestEntry));
check("Manifest context-rule domain", manifestEntry?.domain, "context-rule");
check("Manifest context-rule candidate path", manifestEntry?.candidate, datasetPath);
check("Manifest context-rule published target", manifestEntry?.published, null);
check("Manifest context-rule review status", manifestEntry?.reviewStatus, "Candidate");
check("Manifest context-rule auto publish disabled", manifestEntry?.autoPublish, false);

check("Review template version", reviewTemplate.version, "0.1.0");
check("Review template dataset id", reviewTemplate.datasetId, "context-rules");
check("Review template candidate version", reviewTemplate.candidateVersion, dataset.version);
check("Review template status", reviewTemplate.reviewStatus, "Pending");
check("Review template decisions", reviewTemplate.allowedDecisions, expectedDecisions);
check("Review template rule IDs", reviewTemplate.records.map((record) => record.id), expectedRecordIds);
checkTrue("Review template decisions remain empty", reviewTemplate.records.every((record) => record.decision === null));
checkTrue("Review template source checks remain Pending", reviewTemplate.records.every((record) => record.sourceCheck === "Pending"));
checkTrue("Review template required changes are arrays", reviewTemplate.records.every((record) => Array.isArray(record.requiredChanges)));
check("Review template reviewer remains empty", reviewTemplate.reviewer, null);
check("Review template reviewedAt remains empty", reviewTemplate.reviewedAt, null);
check("Review template approval remains closed", reviewTemplate.approval, {
  approved: false,
  approvalRecord: null,
  canonicalVersion: null
});

check("Schema draft", schema.$schema, "https://json-schema.org/draft/2020-12/schema");
check("Schema dataset title", schema.title, "Soul Kaleidoscope Phase 6 Context Rule Dataset");
checkTrue("Schema forbids unknown top-level fields", schema.additionalProperties === false);
checkTrue("Schema includes required Phase 6 fields", [
  "version",
  "phase",
  "datasetId",
  "reviewStatus",
  "capturedAt",
  "records",
  "annualPositionMatrix",
  "blockedScopes",
  "governance"
].every((field) => schema.required.includes(field)));

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
checkTrue("No context rule has been reviewed", dataset.records.every((record) => record.lastReviewedAt === null));
checkTrue("Every context rule has a title", dataset.records.every((record) => typeof record.title === "string" && record.title.trim().length > 0));
checkTrue("Every context rule has a stable match key", dataset.records.every((record) =>
  record.matchKey && typeof record.matchKey.type === "string" && record.matchKey.type.trim().length > 0 &&
  typeof record.matchKey.key === "string" && record.matchKey.key.trim().length > 0
));
checkTrue("Context rule match keys are unique", new Set(dataset.records.map((record) => `${record.matchKey.type}:${record.matchKey.key}`)).size === dataset.records.length);
checkTrue("Every context rule declares dependencies", dataset.records.every((record) => Array.isArray(record.dependsOn) && record.dependsOn.length > 0));
checkTrue("Every context rule declares inputs", dataset.records.every((record) => Array.isArray(record.rule?.inputs) && record.rule.inputs.length > 0));
checkTrue("Every context rule declares outputs", dataset.records.every((record) => Array.isArray(record.rule?.outputs) && record.rule.outputs.length > 0));
checkTrue("Every context rule declares constraints", dataset.records.every((record) => Array.isArray(record.rule?.constraints) && record.rule.constraints.length > 0));
checkTrue("Every context rule defines an interpretation boundary", dataset.records.every((record) =>
  typeof record.rule?.interpretationBoundary === "string" && record.rule.interpretationBoundary.trim().length > 0
));
checkTrue("Every context rule has source references", dataset.records.every((record) => Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0));
checkTrue("Every source reference is traceable", dataset.records.every((record) => record.sourceRefs.every((source) =>
  typeof source.sourceId === "string" && source.sourceId.trim().length > 0 &&
  typeof source.sourceType === "string" && source.sourceType.trim().length > 0 &&
  typeof source.location === "string" && source.location.trim().length > 0 &&
  typeof source.section === "string" && source.section.trim().length > 0
)));
checkTrue("No context rule is approved", dataset.records.every((record) =>
  record.governance?.approvedBy === null && record.governance?.approvalRecord === null
));
checkTrue("Every context rule contains governance notes", dataset.records.every((record) =>
  typeof record.governance?.notes === "string" && record.governance.notes.trim().length > 0
));

check("Annual values cover 1 through 9", dataset.annualPositionMatrix.annualValues, expectedValues);
check("Position values cover 1 through 9", dataset.annualPositionMatrix.positionValues, expectedValues);
check("Annual-position match key format", dataset.annualPositionMatrix.matchKeyFormat, "annual:<annual>|position:<position>");
check("Annual-position matrix record count", dataset.annualPositionMatrix.recordCount, 81);
check("Generated annual-position key count", generatedMatchKeys.length, 81);
checkTrue("Generated annual-position keys are unique", new Set(generatedMatchKeys).size === 81);
checkTrue("Generated annual-position keys match the required format", generatedMatchKeys.every((key) => /^annual:[1-9]\|position:[1-9]$/.test(key)));
check("Annual-position interpretations remain empty", dataset.annualPositionMatrix.interpretations, null);
check("Annual-position automatic interpretation generation is disabled", dataset.annualPositionMatrix.autoGenerateInterpretations, false);
checkTrue("Annual-position matrix is not Canonical", dataset.annualPositionMatrix.reviewStatus !== "Canonical");

check("Blocked scope count", dataset.blockedScopes.length, 6);
check("Stable sequential blocked scope IDs", dataset.blockedScopes.map((item) => item.id), expectedBlockedIds);
checkTrue("Blocked scope IDs are unique", new Set(dataset.blockedScopes.map((item) => item.id)).size === dataset.blockedScopes.length);
checkTrue("Every blocked scope has a scope and reason", dataset.blockedScopes.every((item) =>
  typeof item.scope === "string" && item.scope.trim().length > 0 &&
  typeof item.reason === "string" && item.reason.trim().length > 0
));

check("Manual approval is required", dataset.governance.manualApprovalRequired, true);
check("Automatic publication is disabled", dataset.governance.autoPublish, false);
check("Published target remains empty", dataset.governance.publishedTarget, null);
check("Approval record remains empty", dataset.governance.approvalRecord, null);
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
console.log(`Validated ${dataset.records.length} candidate rules, ${generatedMatchKeys.length} annual-position match keys, ${dataset.blockedScopes.length} blocked scopes, and ${reviewTemplate.records.length} pending review records.`);
console.log("Publication gate remains closed until manual approval and a Canonical dataset are recorded.");
