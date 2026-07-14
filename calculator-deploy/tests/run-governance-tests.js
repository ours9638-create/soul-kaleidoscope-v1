import { existsSync, readFileSync } from "node:fs";

const paths = {
  candidate: "data/knowledge/candidates/context-rules.phase6.v0.1.json",
  canonical: "data/knowledge/canonical/context-rules.phase6.v1.0.0.json",
  review: "data/knowledge/reviews/context-rules.phase6.review-template.json",
  approval: "data/knowledge/approvals/context-rules.phase6.approval.2026-07-14.json",
  manifest: "data/knowledge/manifest.v1.json",
  lifecycle: "docs/KNOWLEDGE_LIFECYCLE_POLICY.md",
  trust: "docs/SOURCE_TRUST_POLICY.md",
  pipeline: "docs/KNOWLEDGE_RELEASE_PIPELINE.md",
  changelog: "docs/CONTEXT_RULES_CHANGELOG.md",
  rollback: "docs/CONTEXT_RULES_ROLLBACK.md"
};

const missingFiles = Object.entries(paths).filter(([, path]) => !existsSync(path));
if (missingFiles.length) {
  console.error(`Governance tests failed: missing files ${missingFiles.map(([name, path]) => `${name}:${path}`).join(", ")}`);
  process.exit(1);
}

const candidate = JSON.parse(readFileSync(paths.candidate, "utf8"));
const canonical = JSON.parse(readFileSync(paths.canonical, "utf8"));
const review = JSON.parse(readFileSync(paths.review, "utf8"));
const approval = JSON.parse(readFileSync(paths.approval, "utf8"));
const manifest = JSON.parse(readFileSync(paths.manifest, "utf8"));
const docs = Object.fromEntries(
  ["lifecycle", "trust", "pipeline", "changelog", "rollback"].map((name) => [name, readFileSync(paths[name], "utf8")])
);
const contextEntry = manifest.datasets.find((dataset) => dataset.id === "context-rule");

const checks = [];
function check(name, condition, details = null) {
  checks.push({ name, condition: Boolean(condition), details, pass: Boolean(condition) });
}
function containsAll(text, terms) {
  return terms.every((term) => text.includes(term));
}

check("Candidate remains immutable evidence", candidate.reviewStatus === "Candidate" && candidate.records.every((record) => record.reviewStatus === "Candidate" && record.lastReviewedAt === null));
check("Review is approved", review.reviewStatus === "Approved" && review.approval?.approved === true);
check("Review has 14 decisions", review.records.length === 14 && review.records.every((record) => Boolean(record.decision)));
check("Approval reviewer recorded", approval.reviewer === "ours9638-create" && Number.isFinite(Date.parse(approval.reviewedAt)));
check("Approval authorizes canonical draft", approval.canonicalVersion === "1.0.0-draft");
check("Approval does not authorize merge", approval.mergeApproved === false);
check("Approval does not authorize runtime publication", approval.runtimePublicationApproved === false);
check("Approval retains blocked scopes", approval.blockedScopesRemainClosed === true);

check("Canonical draft links Candidate", canonical.governance.candidateSource === paths.candidate);
check("Canonical draft links review", canonical.governance.reviewRecord === paths.review);
check("Canonical draft links approval", canonical.governance.approvalRecord === paths.approval && canonical.approvalRecord === paths.approval);
check("Canonical draft lifecycle is not Published", canonical.lifecycleStatus === "CanonicalDraft" && canonical.governance.publishedTarget === null);
check("Canonical draft does not authorize merge", canonical.governance.mergeApproved === false);
check("Canonical draft does not authorize runtime", canonical.governance.runtimePublicationApproved === false && canonical.governance.runtimePublishable === false);
check("Canonical draft blocks auto publish", canonical.governance.autoPublish === false);
check("Canonical draft retains six blocked scopes", canonical.blockedScopes.length === 6);

check("Manifest registers Candidate", contextEntry?.candidate === paths.candidate);
check("Manifest registers CanonicalDraft", contextEntry?.canonicalDraft === paths.canonical);
check("Manifest has no Published context target", contextEntry?.published === null);
check("Manifest marks context lifecycle", contextEntry?.lifecycleStatus === "CanonicalDraft");
check("Manifest runtime publication closed", contextEntry?.runtimePublicationApproved === false);
check("Manifest automatic publication closed", contextEntry?.autoPublish === false);
check("Manifest requires manual approval", manifest.governance.manualApprovalRequired === true);
check("Runtime Drive read disabled", manifest.sourceOfTruth.runtimeReadsGoogleDrive === false);

check("Lifecycle policy contains all states", containsAll(docs.lifecycle, ["Draft", "Candidate", "Reviewed", "CanonicalDraft", "Canonical", "Published", "Deprecated", "Archived"]));
check("Lifecycle separates merge and publication", docs.lifecycle.includes("Merge approval and runtime publication approval are separate decisions"));
check("Trust policy defines A-E", containsAll(docs.trust, ["**A**", "**B**", "**C**", "**D**", "**E**"]));
check("Trust policy blocks inference publication", docs.trust.includes("prohibited from publication"));
check("Release pipeline contains required stages", containsAll(docs.pipeline, ["Google Drive source", "normalized Candidate", "human review", "approval record", "CanonicalDraft", "runtime-isolation test", "runtime publication approval", "Published manifest target", "Cloudflare deployment", "release record"]));
check("Changelog records approved changes", containsAll(docs.changelog, ["CTX-002", "CTX-004", "CTX-011", "CTX-014", "Merge approval: not granted", "Runtime publication approval: not granted"]));
check("Rollback prohibits in-place edit", docs.rollback.includes("Never edit an approved Canonical or Published file in place"));
check("Rollback blocks Candidate fallback", docs.rollback.includes("using an unreviewed Candidate as emergency runtime fallback"));

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Governance tests failed ${checks.length - failed.length}/${checks.length}.`);
  for (const item of failed) console.error(`- ${item.name}: ${JSON.stringify(item.details ?? item.condition)}`);
  process.exit(1);
}

console.log(`Governance tests passed ${checks.length}/${checks.length}.`);
console.log("Candidate evidence, CanonicalDraft, approval boundaries, lifecycle, trust, release, changelog, and rollback controls are present.");