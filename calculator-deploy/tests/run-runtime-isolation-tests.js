import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const manifestPath = "data/knowledge/manifest.v1.json";
const canonicalPath = "data/knowledge/canonical/context-rules.phase6.v1.0.0.json";
const publicDir = "public";
const buildPath = "build-calculator.js";
const wranglerPath = "wrangler.jsonc";

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
const wranglerText = readFileSync(wranglerPath, "utf8");
const buildText = readFileSync(buildPath, "utf8");
const contextEntry = manifest.datasets.find((dataset) => dataset.id === "context-rule");

function listFiles(root) {
  const results = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) results.push(...listFiles(path));
    else results.push(path);
  }
  return results;
}

const textExtensions = new Set([".html", ".js", ".mjs", ".css", ".json", ".webmanifest", ".txt", ".svg"]);
const publicFiles = listFiles(publicDir);
const searchableFiles = publicFiles.filter((path) => {
  const dot = path.lastIndexOf(".");
  return dot >= 0 && textExtensions.has(path.slice(dot));
});
const forbiddenRuntimeTokens = [
  "data/knowledge/candidates/",
  "data/knowledge/canonical/",
  "context-rules.phase6",
  "manifest.v1.json",
  "runtimeReadsGoogleDrive",
  "knowledgeBaseFolderId"
];

const tokenViolations = [];
for (const path of searchableFiles) {
  const text = readFileSync(path, "utf8");
  for (const token of forbiddenRuntimeTokens) {
    if (text.includes(token)) tokenViolations.push({ path: relative(".", path), token });
  }
}
for (const token of ["data/knowledge/candidates/", "data/knowledge/canonical/", "context-rules.phase6.v1.0.0.json"]) {
  if (buildText.includes(token)) tokenViolations.push({ path: buildPath, token });
}

const publicKnowledgeFiles = publicFiles
  .map((path) => relative(publicDir, path).replaceAll("\\", "/"))
  .filter((path) => /context-rule|knowledge\/candidates|knowledge\/canonical/i.test(path));

const checks = [];
function check(name, condition, details = null) {
  checks.push({ name, condition: Boolean(condition), details, pass: Boolean(condition) });
}

check("Wrangler deploys public only", /"directory"\s*:\s*"\.\/public"/.test(wranglerText));
check("Public directory exists", existsSync(publicDir));
check("No forbidden knowledge token in runtime assets", tokenViolations.length === 0, tokenViolations);
check("No context Candidate or Canonical file copied to public", publicKnowledgeFiles.length === 0, publicKnowledgeFiles);
check("Manifest does not read Drive", manifest.sourceOfTruth.runtimeReadsGoogleDrive === false);
check("Manifest requires manual approval", manifest.governance.manualApprovalRequired === true);
check("Only Canonical status may publish", JSON.stringify(manifest.governance.publishableStatuses) === JSON.stringify(["Canonical"]));
check("Context manifest entry exists", Boolean(contextEntry));
check("Context Candidate remains outside runtime", contextEntry?.candidate === "data/knowledge/candidates/context-rules.phase6.v0.1.json");
check("Context CanonicalDraft remains outside runtime", contextEntry?.canonicalDraft === canonicalPath);
check("Context published target remains empty", contextEntry?.published === null);
check("Context automatic publication disabled", contextEntry?.autoPublish === false);
check("Context runtime approval disabled", contextEntry?.runtimePublicationApproved === false);
check("Canonical draft runtime flag disabled", canonical.governance.runtimePublishable === false);
check("Canonical draft runtime approval disabled", canonical.governance.runtimePublicationApproved === false);
check("Canonical draft published target empty", canonical.governance.publishedTarget === null);
check("Annual-position content not runtime publishable", canonical.annualPositionMatrix.runtimePublishable === false);
check("Annual-position interpretation remains empty", canonical.annualPositionMatrix.interpretations === null);

const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`Runtime isolation tests failed ${checks.length - failed.length}/${checks.length}.`);
  for (const item of failed) console.error(`- ${item.name}: ${JSON.stringify(item.details ?? item.condition)}`);
  process.exit(1);
}

console.log(`Runtime isolation tests passed ${checks.length}/${checks.length}.`);
console.log(`Scanned ${searchableFiles.length} runtime text assets; Candidate and CanonicalDraft data remain outside public assets.`);