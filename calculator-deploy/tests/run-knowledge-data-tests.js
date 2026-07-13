import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

execFileSync(process.execPath, ["scripts/compare-number-topics.js"], { stdio: "inherit" });

const manifest = JSON.parse(readFileSync("data/knowledge/manifest.v1.json", "utf8"));
const mapping = JSON.parse(readFileSync("data/knowledge/mappings/number-topic.drive.v1.json", "utf8"));
const candidate = JSON.parse(readFileSync("data/knowledge/candidates/number-topics.drive.v1.json", "utf8"));
const published = JSON.parse(readFileSync("data/sngl/numbers.v1.json", "utf8"));
const report = JSON.parse(readFileSync("data/knowledge/reports/number-topic-diff.generated.json", "utf8"));
const schema = JSON.parse(readFileSync("schemas/knowledge-record.schema.json", "utf8"));

const checks = [];
function check(name, actual, expected) {
  checks.push({ name, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) });
}

const allowedStatuses = new Set(["Pending", "Candidate", "Reviewed", "Rejected", "Conflict", "Canonical"]);
const requiredContent = ["title", "theme", "observation", "mature", "imbalance", "action"];
const expectedNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const numberDataset = manifest.datasets.find((dataset) => dataset.id === "number-topic");

check("Knowledge manifest version", manifest.version, "1.0.0");
check("Runtime does not read Drive", manifest.sourceOfTruth.runtimeReadsGoogleDrive, false);
check("Only Canonical may publish", manifest.governance.publishableStatuses, ["Canonical"]);
check("Manual approval required", manifest.governance.manualApprovalRequired, true);
check("Number-topic dataset exists", Boolean(numberDataset), true);
check("Number-topic auto publish disabled", numberDataset.autoPublish, false);
check("Mapping source spreadsheet", mapping.source.spreadsheetId, "10qEkd8M1BCT16ozjO1lT-MZAOwwl9dZdtfGl82NsHKo");
check("Mapping direct Drive runtime disabled", mapping.publishPolicy.directRuntimeDriveRead, false);
check("Mapping candidate publish disabled", mapping.publishPolicy.candidateMayPublish, false);
check("Mapping covers 22 Drive columns", mapping.columns.length, 22);
check("Knowledge schema required envelope", schema.required, ["id", "domain", "matchKey", "reviewStatus", "version", "sourceRefs", "content"]);
check("Candidate contains 10 records", candidate.records.length, 10);
check("Candidate covers 0 through 9", candidate.records.map((record) => record.matchKey.number).sort((a, b) => a - b), expectedNumbers);
check("Published covers 0 through 9", Object.keys(published.numbers).map(Number).sort((a, b) => a - b), expectedNumbers);
check("All candidate IDs are stable", candidate.records.map((record) => record.id), expectedNumbers.map((number) => `NUM-${String(number).padStart(3, "0")}`));
check("All source records are Candidate", candidate.records.every((record) => record.reviewStatus === "Candidate"), true);
check("All review statuses are valid", candidate.records.every((record) => allowedStatuses.has(record.reviewStatus)), true);
check("All records use number-topic domain", candidate.records.every((record) => record.domain === "number-topic"), true);
check("All records have required content", candidate.records.every((record) => requiredContent.every((field) => typeof record.content[field] === "string" && record.content[field].trim().length > 0)), true);
check("All records have source references", candidate.records.every((record) => Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0), true);
check("All records point to source sheet", candidate.records.every((record) => record.sourceRefs[0].location.includes(mapping.source.spreadsheetId)), true);
check("All candidates remain non-publishable", candidate.records.every((record) => record.reviewStatus !== "Canonical"), true);
check("Diff report candidate count", report.summary.candidateRecords, 10);
check("Diff report published count", report.summary.publishedRecords, 10);
check("Diff report canonical count", report.summary.canonicalRecords, 0);
check("Diff report auto publish blocked", report.summary.autoPublishEligible, false);
check("Diff report requires review", report.records.every((record) => record.manualReview), true);
check("Diff report contains no missing published records", report.records.every((record) => record.publishedRecordExists), true);

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Knowledge data tests failed ${checks.length - failed.length}/${checks.length}`);
  for (const item of failed) console.error(`- ${item.name}: ${JSON.stringify(item.actual)} !== ${JSON.stringify(item.expected)}`);
  process.exit(1);
}

console.log(`Knowledge data tests passed ${checks.length}/${checks.length}.`);
console.log(`Knowledge dataset ${candidate.datasetId}; candidates ${candidate.records.length}; publish gate blocked as designed.`);
