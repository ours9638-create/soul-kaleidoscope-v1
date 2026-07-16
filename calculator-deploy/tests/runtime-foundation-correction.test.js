import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  RuntimeManifestError,
  createRuntimeDatasetProvider,
  loadPublishedDatasets
} from "../src/runtime/runtime-manifest-loader.js";
import {
  REQUIRED_DATASET_IDS,
  TRUSTED_DATASET_REGISTRY
} from "../src/runtime/trusted-dataset-registry.js";

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
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeFixture(t) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "r3-correction-"));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const relativePath of [MANIFEST_RELATIVE_PATH, NUMBERS_RELATIVE_PATH, POSITIONS_RELATIVE_PATH]) {
    const target = path.join(fixture, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relativePath), target);
  }
  return fixture;
}

function updateManifest(fixture, update) {
  const manifestPath = path.join(fixture, MANIFEST_RELATIVE_PATH);
  const manifest = readJson(manifestPath);
  update(manifest);
  writeJson(manifestPath, manifest);
}

function updateDatasetAndHash(fixture, datasetIndex, update) {
  const manifest = readJson(path.join(fixture, MANIFEST_RELATIVE_PATH));
  const relativePath = manifest.datasets[datasetIndex].published.artifactPath;
  const absolutePath = path.join(fixture, relativePath);
  const data = readJson(absolutePath);
  update(data);
  writeJson(absolutePath, data);
  const bytes = fs.readFileSync(absolutePath);
  updateManifest(fixture, (nextManifest) => {
    nextManifest.datasets[datasetIndex].published.hash.hashValue = sha256(bytes);
  });
}

function expectCode(action, code) {
  assert.throws(action, (error) => error instanceof RuntimeManifestError && error.code === code);
}

function createProvider(fixture) {
  return createRuntimeDatasetProvider({
    rootDir: fixture,
    legacyLoader: () => ({ datasets: { legacy: { data: { version: "approved" } } } })
  });
}

test("trusted registry is an immutable external approval anchor", () => {
  assert.deepEqual(REQUIRED_DATASET_IDS, ["number-topic", "position"]);
  assert.equal(Object.isFrozen(TRUSTED_DATASET_REGISTRY), true);
  assert.equal(Object.isFrozen(TRUSTED_DATASET_REGISTRY["number-topic"]), true);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(TRUSTED_DATASET_REGISTRY).map(([datasetId, entry]) => [datasetId, {
        approvedPath: entry.approvedPath,
        approvedBaselineId: entry.approvedBaselineId,
        approvedEvidencePath: entry.approvedEvidencePath
      }])
    ),
    {
      "number-topic": {
        approvedPath: NUMBERS_RELATIVE_PATH,
        approvedBaselineId: "approved-consumer-baseline",
        approvedEvidencePath: "Records/consumer-baseline/r2/R2_FINAL_CLOSEOUT.md"
      },
      position: {
        approvedPath: POSITIONS_RELATIVE_PATH,
        approvedBaselineId: "approved-consumer-baseline",
        approvedEvidencePath: "Records/consumer-baseline/r2/R2_FINAL_CLOSEOUT.md"
      }
    }
  );
});

test("Runtime manifest requires the exact Dataset set", async (t) => {
  await t.test("only number-topic fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => manifest.datasets.splice(1, 1));
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "REQUIRED_DATASET_SET_INVALID");
  });
  await t.test("only position fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => manifest.datasets.splice(0, 1));
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "REQUIRED_DATASET_SET_INVALID");
  });
  await t.test("both required Datasets pass", () => {
    const fixture = makeFixture(t);
    const loaded = loadPublishedDatasets({ rootDir: fixture });
    assert.deepEqual(Object.keys(loaded.datasets), ["number-topic", "position"]);
  });
  await t.test("a third Dataset ID fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      const extra = structuredClone(manifest.datasets[0]);
      extra.id = "third-dataset";
      manifest.datasets.push(extra);
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "REQUIRED_DATASET_SET_INVALID");
  });
  await t.test("a duplicate Dataset ID fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[1].id = manifest.datasets[0].id;
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "DUPLICATE_DATASET_ID");
  });
});

test("trusted registry rejects Manifest self-approval and path repackaging", async (t) => {
  await t.test("approved ID, path, baseline and evidence pass", () => {
    const fixture = makeFixture(t);
    assert.equal(loadPublishedDatasets({ rootDir: fixture }).datasets.position.approvalBaseline, "approved-consumer-baseline");
  });
  await t.test("forged baselineId fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].published.approval.baselineId = "self-approved";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "UNTRUSTED_DATASET_APPROVAL");
  });
  await t.test("forged evidencePath fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].published.approval.evidencePath = "Records/self-approved.md";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "UNTRUSTED_DATASET_APPROVAL");
  });
  await t.test("Drive-named path fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].published.artifactPath = "data/sngl/numbers.drive.v1.json";
      manifest.datasets[0].published.hash.artifactPath = "data/sngl/numbers.drive.v1.json";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "UNTRUSTED_DATASET_PATH");
  });
  await t.test("Candidate with identical bytes and Hash fails", () => {
    const fixture = makeFixture(t);
    const candidatePath = "data/sngl/numbers.candidate.v1.json";
    fs.copyFileSync(path.join(fixture, NUMBERS_RELATIVE_PATH), path.join(fixture, candidatePath));
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].published.artifactPath = candidatePath;
      manifest.datasets[0].published.hash.artifactPath = candidatePath;
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "UNTRUSTED_DATASET_PATH");
  });
  await t.test("arbitrary new path fails", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      manifest.datasets[0].published.artifactPath = "data/sngl/numbers.v2.json";
      manifest.datasets[0].published.hash.artifactPath = "data/sngl/numbers.v2.json";
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "UNTRUSTED_DATASET_PATH");
  });
  await t.test("Dataset IDs cannot cross-pair approved paths", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => {
      const numberPath = manifest.datasets[0].published.artifactPath;
      const numberHashPath = manifest.datasets[0].published.hash.artifactPath;
      manifest.datasets[0].published.artifactPath = manifest.datasets[1].published.artifactPath;
      manifest.datasets[0].published.hash.artifactPath = manifest.datasets[1].published.hash.artifactPath;
      manifest.datasets[1].published.artifactPath = numberPath;
      manifest.datasets[1].published.hash.artifactPath = numberHashPath;
    });
    expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "UNTRUSTED_DATASET_PATH");
  });
});

test("strict RFC3339 validation agrees between Schema pattern and Loader", async (t) => {
  const schema = readJson(path.join(ROOT, "schemas/runtime-manifest.schema.json"));
  const schemaPattern = new RegExp(schema.properties.generatedAt.pattern);
  const cases = [
    ["2026-02-30T12:00:00Z", false],
    ["2025-02-29T12:00:00Z", false],
    ["2024-02-29T12:00:00Z", true],
    ["2026-07-16T12:34:56Z", true],
    ["2026-07-16T12:34:56+08:00", true],
    ["2026-07-16T12:34:56-05:30", true],
    ["2026-13-01T00:00:00Z", false],
    ["2026-01-00T00:00:00Z", false],
    ["2026-01-01T24:00:00Z", false],
    ["2026-01-01T00:60:00Z", false],
    ["2026-01-01T00:00:60Z", false],
    ["2026-01-01T00:00:00+24:00", false],
    ["2026-01-01T00:00:00+12:60", false]
  ];

  for (const [timestamp, expected] of cases) {
    await t.test(`${timestamp} ${expected ? "passes" : "fails"}`, () => {
      assert.equal(schemaPattern.test(timestamp), expected);
      const fixture = makeFixture(t);
      updateManifest(fixture, (manifest) => {
        manifest.generatedAt = timestamp;
      });
      if (expected) {
        assert.equal(loadPublishedDatasets({ rootDir: fixture }).manifestId, "soul-kaleidoscope-runtime-foundation-r3");
      } else {
        expectCode(() => loadPublishedDatasets({ rootDir: fixture }), "MANIFEST_SCHEMA_INVALID");
      }
    });
  }
});

test("last-known-good updates only after a complete validated snapshot", async (t) => {
  await t.test("second Dataset failure after first Dataset loads preserves last-known-good", () => {
    const fixture = makeFixture(t);
    const provider = createProvider(fixture);
    const first = provider.load({ runtimeManifestLoader: true });
    fs.appendFileSync(path.join(fixture, POSITIONS_RELATIVE_PATH), " ", "utf8");
    const second = provider.load({ runtimeManifestLoader: true });
    assert.equal(first.mode, "manifest");
    assert.equal(second.mode, "rollback");
    assert.equal(second.error.code, "HASH_MISMATCH");
    assert.equal(second.snapshot, first.snapshot);
    assert.equal(provider.getLastKnownGood(), first.snapshot);
  });

  await t.test("consumer contract failure preserves last-known-good", () => {
    const fixture = makeFixture(t);
    const provider = createProvider(fixture);
    const first = provider.load({ runtimeManifestLoader: true });
    updateDatasetAndHash(fixture, 1, (data) => {
      delete data.positions["9"].action;
    });
    const second = provider.load({ runtimeManifestLoader: true });
    assert.equal(first.mode, "manifest");
    assert.equal(second.mode, "rollback");
    assert.equal(second.error.code, "CONSUMER_CONTRACT_INVALID");
    assert.equal(second.snapshot, first.snapshot);
    assert.equal(provider.getLastKnownGood(), first.snapshot);
  });

  await t.test("incomplete first snapshot uses safe fallback and never returns partial data", () => {
    const fixture = makeFixture(t);
    updateManifest(fixture, (manifest) => manifest.datasets.splice(1, 1));
    const provider = createProvider(fixture);
    const result = provider.load({ runtimeManifestLoader: true });
    assert.equal(result.mode, "safe-fallback");
    assert.equal(result.error.code, "REQUIRED_DATASET_SET_INVALID");
    assert.deepEqual(Object.keys(result.snapshot.datasets), ["legacy"]);
    assert.equal(provider.getLastKnownGood(), null);
  });
});
