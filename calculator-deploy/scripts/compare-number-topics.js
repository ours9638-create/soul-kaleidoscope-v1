import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const candidatePath = "data/knowledge/candidates/number-topics.drive.v1.json";
const publishedPath = "data/sngl/numbers.v1.json";
const outputPath = "data/knowledge/reports/number-topic-diff.generated.json";

const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
const published = JSON.parse(readFileSync(publishedPath, "utf8"));
const canonicalStatuses = new Set(["Canonical"]);
const fields = [
  ["title", (record) => record.content.title, (entry) => entry.title],
  ["observation/core", (record) => record.content.observation, (entry) => entry.core],
  ["mature", (record) => record.content.mature, (entry) => entry.mature],
  ["imbalance", (record) => record.content.imbalance, (entry) => entry.imbalance],
  ["action", (record) => record.content.action, (entry) => entry.action],
  ["colors", (record) => record.applications?.colors || [], (entry) => entry.colors || []]
];

function stable(value) {
  return JSON.stringify(value);
}

function compareRecord(record) {
  const number = String(record.matchKey.number);
  const target = published.numbers?.[number];
  if (!target) {
    return {
      id: record.id,
      number: Number(number),
      reviewStatus: record.reviewStatus,
      publishedRecordExists: false,
      fields: [],
      differingFields: ["missing-published-record"],
      manualReview: true
    };
  }

  const fieldResults = fields.map(([field, sourceGetter, publishedGetter]) => {
    const sourceValue = sourceGetter(record);
    const publishedValue = publishedGetter(target);
    return {
      field,
      same: stable(sourceValue) === stable(publishedValue),
      candidateValue: sourceValue,
      publishedValue
    };
  });
  const differingFields = fieldResults.filter((item) => !item.same).map((item) => item.field);
  const conflicts = record.governance?.conflicts || [];

  return {
    id: record.id,
    number: Number(number),
    reviewStatus: record.reviewStatus,
    publishedRecordExists: true,
    fields: fieldResults,
    differingFields,
    geometryReviewRequired: !record.applications?.geometry,
    conflicts,
    manualReview: differingFields.length > 0 || conflicts.length > 0 || !canonicalStatuses.has(record.reviewStatus)
  };
}

if (!Array.isArray(candidate.records)) throw new Error("Candidate number-topic snapshot must contain records[]");
const records = candidate.records.map(compareRecord);
const ids = new Set();
const numbers = new Set();
for (const record of candidate.records) {
  if (ids.has(record.id)) throw new Error(`Duplicate candidate id: ${record.id}`);
  if (numbers.has(record.matchKey.number)) throw new Error(`Duplicate candidate number: ${record.matchKey.number}`);
  ids.add(record.id);
  numbers.add(record.matchKey.number);
}

const canonicalCount = candidate.records.filter((record) => canonicalStatuses.has(record.reviewStatus)).length;
const differingRecords = records.filter((record) => record.differingFields.length > 0).length;
const differingFields = records.reduce((sum, record) => sum + record.differingFields.length, 0);
const unchangedFields = records.reduce((sum, record) => sum + record.fields.filter((field) => field.same).length, 0);
const conflictCount = candidate.records.reduce((sum, record) => sum + (record.governance?.conflicts?.length || 0), 0);
const autoPublishEligible = canonicalCount === candidate.records.length && differingRecords === 0 && conflictCount === 0;

const report = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  datasetId: candidate.datasetId,
  candidateVersion: candidate.version,
  publishedVersion: published.version,
  sourceSnapshot: candidate.sourceSnapshot,
  policy: {
    candidateMayPublish: false,
    canonicalRequired: true,
    manualApprovalRequired: true
  },
  summary: {
    candidateRecords: candidate.records.length,
    publishedRecords: Object.keys(published.numbers || {}).length,
    canonicalRecords: canonicalCount,
    candidateOnlyRecords: candidate.records.length - canonicalCount,
    differingRecords,
    differingFields,
    unchangedFields,
    conflictCount,
    autoPublishEligible
  },
  records
};

mkdirSync("data/knowledge/reports", { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Knowledge diff compared ${report.summary.candidateRecords} candidate records with ${report.summary.publishedRecords} published records.`);
console.log(`Knowledge diff found ${differingRecords} records and ${differingFields} fields requiring review.`);
console.log(`Knowledge auto-publish eligible: ${autoPublishEligible ? "yes" : "no"}.`);
