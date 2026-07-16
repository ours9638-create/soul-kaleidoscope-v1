import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DEFAULT_FEATURE_FLAGS, resolveFeatureFlags } from "../src/runtime/feature-flags.js";
import * as runtimeManifestModule from "../src/runtime/runtime-manifest-loader.js";
import {
  RuntimeManifestError,
  createRuntimeDatasetProvider,
  loadPublishedDatasets
} from "../src/runtime/runtime-manifest-loader.js";

const ROOT = process.cwd();
const MANIFEST_RELATIVE_PATH = "data/runtime/manifest.v1.json";
const NUMBERS_RELATIVE_PATH = "data/sngl/numbers.v1.json";
const POSITIONS_RELATIVE_PATH = "data/sngl/positions.v1.json";

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeFixture(t) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "r3-runtime-"));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixture, "data/runtime"), { recursive: true });
  fs.mkdirSync(path.join(fixture, "data/sngl"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, MANIFEST_RELATIVE_PATH), path.join(fixture, MANIFEST_RELATIVE_PATH));
  fs.copyFileSync(path.join(ROOT, NUMBERS_RELATIVE_PATH), path.join(fixture, NUMBERS_RELATIVE_PATH));
  fs.copyFileSync(path.join(ROOT, POSITIONS_RELATIVE_PATH), path.join(fixture, POSITIONS_RELATIVE_PATH));
  return fixture;
}

function updateManifest(fixture, update) {
  const manifestPath = path.join(fixture, MANIFEST_RELATIVE_PATH);
  const manifest = readJson(manifestPath);
  update(manifest);
  writeJson(manifestPath, manifest);
}

function expectCode(action, code) {
  assert.throws(action, (error) => error instanceof RuntimeManifestError && error.code === code);
}

test("feature flags are explicit, immutable and default false", () => {
  assert.deepEqual(DEFAULT_FEATURE_FLAGS, { runtimeManifestLoader: false });
  assert.equal(Object.isFrozen(DEFAULT_FEATURE_FLAGS), true);
  assert.deepEqual(resolveFeatureFlags(), DEFAULT_FEATURE_FLAGS);
  assert.deepEqual(resolveFeatureFlags({ runtimeManifestLoader: true }), { runtimeManifestLoader: true });
  assert.throws(() => resolveFeatureFlags({ runtimeManifestLoader: "true" }), /must be boolean/);
  assert.throws(() => resolveFeatureFlags({ f001: false }), /Unknown feature flag/);
});

test("runtime manifest schema fixes the Published and Candidate contract", () => {
  assert.deepEqual(Object.keys(runtimeManifestModule).sort(), [
    "RuntimeManifestError",
    "createRuntimeDatasetProvider",
    "loadPublishedDatasets"
  ]);
  const schema = readJson(path.join(ROOT, "schemas/runtime-manifest.schema.json"));
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.schemaVersion.const, "1.0.0");
  assert.equal(schema.$defs.dataset.additionalProperties, false);
  assert.deepEqual(schema.$defs.dataset.required, ["id", "candidateWorkflow", "published"]);
  assert.equal(schema.$defs.candidateWorkflow.properties.runtimeReadable.const, false);
  assert.deepEqual(schema.$defs.approval.properties.status.enum, ["approved", "pending", "revoked"]);
  assert.equal(schema.$defs.hash.properties.algorithm.const, "SHA-256");
  assert.equal(schema.$defs.hash.properties.fileCount.const, 1);
  assert.equal(schema.$defs.hash.properties.normalization.const, "none");
});

test("committed manifest validates and loads only approved Published Artifacts", () => {
  const loaded = loadPublishedDatasets({ rootDir: ROOT });
  assert.equal(loaded.manifestId, "soul-kaleidoscope-runtime-foundation-r3");
  assert.deepEqual(Object.keys(loaded.datasets), ["number-topic", "position"]);
  assert.equal(loaded.datasets["number-topic"].artifactPath, NUMBERS_RELATIVE_PATH);
  assert.equal(loaded.datasets.position.artifactPath, POSITIONS_RELATIVE_PATH);
  assert.equal(loaded.datasets["number-topic"].data.version, "1.0.0");
  assert.equal(loaded.datasets.position.data.version, "1.0.0");
});

test("loader reads the manifest and Published targets, never Candidate workflow paths", (t) => {
  const fixture = makeFixture(t);
  const reads = [];
  loadPublishedDatasets({
    rootDir: fixture,
    readFile(filePath) {
      reads.push(path.relative(fixture, filePath).replaceAll("\\", "/"));
      return fs.readFileSync(filePath);
    }
  });
  assert.deepEqual(reads, [MANIFEST_RELATIVE_PATH, NUMBERS_RELATIVE_PATH, POSITIONS_RELATIVE_PATH]);
  assert.equal(reads.some((filePath) => filePath.includes("candidate")), false);
  assert.equal(reads.some((filePath) => filePath.includes("mapping")), false);
  assert.equal(reads.some((filePath) => filePath.includes("report")), false);
});

test("LF raw bytes pass and CRLF raw bytes fail with a different hash", (t) => {
  const fixture = makeFixture(t);
  const numbersPath = path.join(fixture, NUMBERS_RELATIVE_PATH);
  const lfBytes = fs.readFileSync(numbersPath);
  assert.equal(sha256(lfBytes), "c6cea4f8a73888cf556fc0ebb8e259fa65df173154bf0c7401e17aeaab91693d");
  const crlfBytes = Buffer.from(lfBytes.toString("utf8").replace(/\n/g, "\r\n"), "utf8");
  assert.notEqual(sha256(crlfBytes), sha256(lfBytes));
  fs.writeFileSync(numbersPath, crlfBytes);
  updateManifest(fixture, (manifest) => {
    manifest.datasets[0].published.hash.hashValue = sha256(crlfBytes);
  });
  expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "LINE_ENDING_MISMATCH");
});

test("single-byte changes fail hash validation before JSON use", (t) => {
  const fixture = makeFixture(t);
  fs.appendFileSync(path.join(fixture, NUMBERS_RELATIVE_PATH), " ", "utf8");
  expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "HASH_MISMATCH");
});

test("missing and malformed Published Artifacts fail closed", async (t) => {
  await t.test("missing artifact", () => {
    const fixture = makeFixture(t);
    fs.rmSync(path.join(fixture, NUMBERS_RELATIVE_PATH));
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "ARTIFACT_MISSING");
  });
  await t.test("malformed artifact", () => {
    const fixture = makeFixture(t);
    const malformed = Buffer.from("{", "utf8");
    fs.writeFileSync(path.join(fixture, NUMBERS_RELATIVE_PATH), malformed);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].published.hash.hashValue = sha256(malformed);
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "ARTIFACT_INVALID_JSON");
  });
});

test("malformed manifest and unsupported schema versions fail closed", async (t) => {
  await t.test("missing manifest", () => {
    const fixture = makeFixture(t);
    fs.rmSync(path.join(fixture, MANIFEST_RELATIVE_PATH));
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "MANIFEST_MISSING");
  });
  await t.test("malformed manifest", () => {
    const fixture = makeFixture(t);
    fs.writeFileSync(path.join(fixture, MANIFEST_RELATIVE_PATH), "{", "utf8");
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "MANIFEST_INVALID_JSON");
  });
  await t.test("unsupported version", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.schemaVersion = "2.0.0";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "UNSUPPORTED_SCHEMA_VERSION");
  });
});

test("schema rejects blank fields, unknown fields and duplicate dataset IDs", async (t) => {
  await t.test("blank dataset ID", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].id = " ";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "MANIFEST_SCHEMA_INVALID");
  });
  await t.test("unknown source field", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].source = "Drive";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "MANIFEST_SCHEMA_INVALID");
  });
  await t.test("unsafe dataset ID", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].id = "__proto__";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "MANIFEST_SCHEMA_INVALID");
  });
  await t.test("invalid timestamp", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.generatedAt = "1";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "MANIFEST_SCHEMA_INVALID");
  });
  await t.test("duplicate dataset ID", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[1].id = manifest.datasets[0].id;
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "DUPLICATE_DATASET_ID");
  });
});

test("unknown, pending and revoked Published approvals cannot authorize Runtime", async (t) => {
  for (const [status, code] of [
    ["mystery", "UNKNOWN_APPROVAL_STATUS"],
    ["pending", "PUBLISHED_NOT_APPROVED"],
    ["revoked", "PUBLISHED_NOT_APPROVED"]
  ]) {
    await t.test(status, () => {
      const fixture = makeFixture(t);
      updateManifest(fixture, (manifest) => {
        manifest.datasets[0].published.approval.status = status;
      });
      expectCode(() => loadPublishedDatasets({ rootDir: fixture }), code);
    });
  }
});

test("Candidate, mapping, source, diff report and Drive paths are forbidden Runtime targets", async (t) => {
  const forbiddenPaths = [
    "data/knowledge/candidates/number-topics.drive.v1.json",
    "data/knowledge/mappings/number-topic.drive.v1.json",
    "data/source/drive.json",
    "data/knowledge/reports/number-topic-diff.generated.json",
    "data/drive/source.json"
  ];
  for (const artifactPath of forbiddenPaths) {
    await t.test(artifactPath, () => {
      const fixture = makeFixture(t);
      updateManifest(fixture, (manifest) => {
        manifest.datasets[0].published.artifactPath = artifactPath;
        manifest.datasets[0].published.hash.artifactPath = artifactPath;
      });
      expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "FORBIDDEN_RUNTIME_TARGET");
    });
  }
});

test("absolute, backslash and traversal paths are rejected", async (t) => {
  const invalidPaths = [
    "C:/temp/numbers.json",
    "data\\sngl\\numbers.v1.json",
    "data/sngl/../knowledge/candidate.json"
  ];
  for (const artifactPath of invalidPaths) {
    await t.test(artifactPath, () => {
      const fixture = makeFixture(t);
      updateManifest(fixture, (manifest) => {
        manifest.datasets[0].published.artifactPath = artifactPath;
        manifest.datasets[0].published.hash.artifactPath = artifactPath;
      });
      expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "PATH_ESCAPE");
    });
  }
});

test("hash scope metadata rejects wrong path, source kind, count, algorithm and normalization", async (t) => {
  const cases = [
    ["artifactPath", (hash) => { hash.artifactPath = POSITIONS_RELATIVE_PATH; }, "HASH_SCOPE_MISMATCH"],
    ["sourceKind", (hash) => { hash.sourceKind = "worktree-source"; }, "HASH_SCOPE_MISMATCH"],
    ["fileCount", (hash) => { hash.fileCount = 2; }, "HASH_SCOPE_MISMATCH"],
    ["algorithm", (hash) => { hash.algorithm = "SHA-1"; }, "HASH_ALGORITHM_UNSUPPORTED"],
    ["normalization", (hash) => { hash.normalization = "lf"; }, "HASH_NORMALIZATION_UNSUPPORTED"]
  ];
  for (const [name, mutate, code] of cases) {
    await t.test(name, () => {
      const fixture = makeFixture(t);
      updateManifest(fixture, (manifest) => mutate(manifest.datasets[0].published.hash));
      expectCode(() => loadPublishedDatasets({ rootDir: fixture }), code);
    });
  }
});

test("Candidate workflow cannot be marked runtime-readable", (t) => {
  const fixture = makeFixture(t);
  updateManifest(fixture, (manifest) => {
    manifest.datasets[0].candidateWorkflow.runtimeReadable = true;
  });
  expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "FORBIDDEN_RUNTIME_TARGET");
});

test("disabled provider uses legacy baseline without reading the manifest", () => {
  let loaderCalls = 0;
  const legacySnapshot = { datasets: { legacy: { data: { version: "approved" } } } };
  const provider = createRuntimeDatasetProvider({
    legacyLoader: () => legacySnapshot,
    loader: () => {
      loaderCalls += 1;
      throw new Error("must not run");
    }
  });
  const result = provider.load();
  assert.equal(result.mode, "legacy");
  assert.equal(result.snapshot.datasets.legacy.data.version, "approved");
  assert.equal(result.error, null);
  assert.equal(loaderCalls, 0);
});

test("first manifest failure returns explicit safe fallback", () => {
  const provider = createRuntimeDatasetProvider({
    legacyLoader: () => ({ datasets: { legacy: { data: { version: "approved" } } } }),
    loader: () => {
      throw new RuntimeManifestError("HASH_MISMATCH", "hash mismatch");
    }
  });
  const result = provider.load({ runtimeManifestLoader: true });
  assert.equal(result.mode, "safe-fallback");
  assert.equal(result.snapshot.datasets.legacy.data.version, "approved");
  assert.deepEqual(result.error, { code: "HASH_MISMATCH", message: "hash mismatch" });
});

test("a later manifest failure rolls back to the last fully validated snapshot", () => {
  const validatedSnapshot = {
    manifestId: "validated",
    schemaVersion: "1.0.0",
    datasets: { published: { data: { version: "1.0.0" } } }
  };
  let loaderCalls = 0;
  const provider = createRuntimeDatasetProvider({
    legacyLoader: () => ({ datasets: { legacy: { data: { version: "approved" } } } }),
    loader: () => {
      loaderCalls += 1;
      if (loaderCalls === 1) return validatedSnapshot;
      throw new RuntimeManifestError("ARTIFACT_MISSING", "artifact missing");
    }
  });

  const first = provider.load({ runtimeManifestLoader: true });
  const second = provider.load({ runtimeManifestLoader: true });
  assert.equal(first.mode, "manifest");
  assert.equal(second.mode, "rollback");
  assert.equal(second.snapshot, first.snapshot);
  assert.deepEqual(second.error, { code: "ARTIFACT_MISSING", message: "artifact missing" });
  assert.equal(provider.getLastKnownGood(), first.snapshot);
});
