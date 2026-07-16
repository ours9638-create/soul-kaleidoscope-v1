import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_FEATURE_FLAGS, resolveFeatureFlags } from "./feature-flags.js";

const SUPPORTED_SCHEMA_VERSION = "1.0.0";
const DEFAULT_MANIFEST_PATH = "data/runtime/manifest.v1.json";
const APPROVAL_STATUSES = new Set(["approved", "pending", "revoked"]);
const CANDIDATE_STATUSES = new Set([
  "Pending",
  "Candidate",
  "Reviewed",
  "Rejected",
  "Conflict",
  "Canonical",
  "NotApplicable"
]);
const FORBIDDEN_TARGET_PATTERN = /(?:^|\/)(?:candidates?|mappings?|reports?|source|diffreports?|drive)(?:\/|$)/i;

export class RuntimeManifestError extends Error {
  constructor(code, message, details = {}, options = {}) {
    super(message, options);
    this.name = "RuntimeManifestError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function fail(code, message, details = {}, options = {}) {
  throw new RuntimeManifestError(code, message, details, options);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertPlainObject(value, context) {
  if (!isPlainObject(value)) {
    fail("MANIFEST_SCHEMA_INVALID", `${context} must be an object`, { context });
  }
}

function assertExactKeys(value, requiredKeys, optionalKeys, context) {
  assertPlainObject(value, context);
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
  const missingKeys = requiredKeys.filter((key) => !(key in value));
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (missingKeys.length || unknownKeys.length) {
    fail("MANIFEST_SCHEMA_INVALID", `${context} fields are invalid`, {
      context,
      missingKeys,
      unknownKeys
    });
  }
}

function assertNonBlankString(value, context) {
  if (typeof value !== "string" || value.trim() === "") {
    fail("MANIFEST_SCHEMA_INVALID", `${context} must be a non-blank string`, { context });
  }
}

function assertIsoTimestamp(value, context) {
  assertNonBlankString(value, context);
  const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoTimestampPattern.test(value) || Number.isNaN(Date.parse(value))) {
    fail("MANIFEST_SCHEMA_INVALID", `${context} must be an ISO timestamp`, { context });
  }
}

function resolveManifestPath(rootDir, manifestPath) {
  assertNonBlankString(manifestPath, "manifestPath");
  const normalized = manifestPath.replace(/\\/g, "/");
  if (
    normalized !== manifestPath ||
    !normalized.startsWith("data/runtime/") ||
    normalized.startsWith("/") ||
    /^[A-Za-z]:/.test(normalized) ||
    normalized.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    fail("MANIFEST_PATH_INVALID", "Runtime manifest path is outside data/runtime", { manifestPath });
  }
  return resolveContainedPath(rootDir, normalized, "data/runtime", "MANIFEST_PATH_INVALID");
}

function assertSafePublishedPath(artifactPath) {
  assertNonBlankString(artifactPath, "published.artifactPath");
  if (
    artifactPath.includes("\\") ||
    artifactPath.startsWith("/") ||
    /^[A-Za-z]:/.test(artifactPath) ||
    artifactPath.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    fail("PATH_ESCAPE", "Published artifact path is not a safe relative POSIX path", { artifactPath });
  }
  if (!artifactPath.startsWith("data/sngl/") || FORBIDDEN_TARGET_PATTERN.test(artifactPath)) {
    fail("FORBIDDEN_RUNTIME_TARGET", "Runtime target is not an approved Published Artifact path", {
      artifactPath
    });
  }
}

function resolvePublishedPath(rootDir, artifactPath) {
  assertSafePublishedPath(artifactPath);
  return resolveContainedPath(rootDir, artifactPath, "data/sngl", "PATH_ESCAPE");
}

function resolveContainedPath(rootDir, relativePath, allowedDirectory, errorCode) {
  const root = path.resolve(rootDir);
  const allowedRoot = path.resolve(root, allowedDirectory);
  const absolutePath = path.resolve(root, relativePath);
  const relativeToAllowed = path.relative(allowedRoot, absolutePath);
  if (relativeToAllowed === "" || relativeToAllowed.startsWith("..") || path.isAbsolute(relativeToAllowed)) {
    fail(errorCode, "Resolved path escaped its allowed directory", { relativePath });
  }
  return absolutePath;
}

function readBytes(readFile, absolutePath, missingCode, label) {
  try {
    const value = readFile(absolutePath);
    return Buffer.isBuffer(value) ? value : Buffer.from(value);
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail(missingCode, `${label} is missing`, { path: absolutePath }, { cause: error });
    }
    fail(`${missingCode}_READ_FAILED`, `${label} could not be read`, { path: absolutePath }, { cause: error });
  }
}

function parseJson(bytes, errorCode, label, details = {}) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail(errorCode, `${label} is not valid JSON`, details, { cause: error });
  }
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function deepFreeze(value, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function validateRuntimeManifest(manifest) {
  assertExactKeys(
    manifest,
    ["schemaVersion", "manifestId", "generatedAt", "datasets"],
    [],
    "manifest"
  );

  assertNonBlankString(manifest.schemaVersion, "manifest.schemaVersion");
  if (manifest.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    fail("UNSUPPORTED_SCHEMA_VERSION", "Runtime manifest schema version is not supported", {
      schemaVersion: manifest.schemaVersion
    });
  }
  assertNonBlankString(manifest.manifestId, "manifest.manifestId");
  assertIsoTimestamp(manifest.generatedAt, "manifest.generatedAt");
  if (!Array.isArray(manifest.datasets) || manifest.datasets.length === 0) {
    fail("MANIFEST_SCHEMA_INVALID", "manifest.datasets must be a non-empty array", {
      context: "manifest.datasets"
    });
  }

  const datasetIds = new Set();
  for (const [index, dataset] of manifest.datasets.entries()) {
    const context = `manifest.datasets[${index}]`;
    assertExactKeys(dataset, ["id", "candidateWorkflow", "published"], [], context);
    assertNonBlankString(dataset.id, `${context}.id`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dataset.id)) {
      fail("MANIFEST_SCHEMA_INVALID", "Runtime manifest dataset ID must be a lowercase slug", {
        datasetId: dataset.id
      });
    }
    if (datasetIds.has(dataset.id)) {
      fail("DUPLICATE_DATASET_ID", "Runtime manifest dataset IDs must be unique", { datasetId: dataset.id });
    }
    datasetIds.add(dataset.id);

    assertExactKeys(
      dataset.candidateWorkflow,
      ["reviewStatus", "artifactPath", "runtimeReadable"],
      [],
      `${context}.candidateWorkflow`
    );
    if (!CANDIDATE_STATUSES.has(dataset.candidateWorkflow.reviewStatus)) {
      fail("MANIFEST_SCHEMA_INVALID", "Candidate workflow status is invalid", { datasetId: dataset.id });
    }
    if (
      dataset.candidateWorkflow.artifactPath !== null &&
      (typeof dataset.candidateWorkflow.artifactPath !== "string" ||
        dataset.candidateWorkflow.artifactPath.trim() === "")
    ) {
      fail("MANIFEST_SCHEMA_INVALID", "Candidate workflow artifactPath must be null or non-blank", {
        datasetId: dataset.id
      });
    }
    if (dataset.candidateWorkflow.runtimeReadable !== false) {
      fail("FORBIDDEN_RUNTIME_TARGET", "Candidate workflow must never be runtime-readable", {
        datasetId: dataset.id
      });
    }

    assertExactKeys(dataset.published, ["artifactPath", "approval", "hash"], [], `${context}.published`);
    assertSafePublishedPath(dataset.published.artifactPath);

    assertExactKeys(
      dataset.published.approval,
      ["status", "baselineId", "evidencePath"],
      [],
      `${context}.published.approval`
    );
    assertNonBlankString(dataset.published.approval.status, `${context}.published.approval.status`);
    if (!APPROVAL_STATUSES.has(dataset.published.approval.status)) {
      fail("UNKNOWN_APPROVAL_STATUS", "Published approval status is unknown", {
        datasetId: dataset.id,
        status: dataset.published.approval.status
      });
    }
    if (dataset.published.approval.status !== "approved") {
      fail("PUBLISHED_NOT_APPROVED", "Published Artifact is not approved for Runtime", {
        datasetId: dataset.id,
        status: dataset.published.approval.status
      });
    }
    assertNonBlankString(dataset.published.approval.baselineId, `${context}.published.approval.baselineId`);
    assertNonBlankString(dataset.published.approval.evidencePath, `${context}.published.approval.evidencePath`);

    assertExactKeys(
      dataset.published.hash,
      [
        "artifactPath",
        "sourceKind",
        "fileCount",
        "algorithm",
        "hashValue",
        "normalization",
        "lineEndingRule",
        "generatedAt",
        "generationMethod"
      ],
      [],
      `${context}.published.hash`
    );
    const hash = dataset.published.hash;
    if (hash.artifactPath !== dataset.published.artifactPath) {
      fail("HASH_SCOPE_MISMATCH", "Hash artifactPath must equal Published artifactPath", {
        datasetId: dataset.id
      });
    }
    if (hash.sourceKind !== "published-artifact") {
      fail("HASH_SCOPE_MISMATCH", "Hash sourceKind must be published-artifact", { datasetId: dataset.id });
    }
    if (hash.fileCount !== 1) {
      fail("HASH_SCOPE_MISMATCH", "A Published single-file hash must have fileCount 1", {
        datasetId: dataset.id
      });
    }
    if (hash.algorithm !== "SHA-256") {
      fail("HASH_ALGORITHM_UNSUPPORTED", "Runtime manifest hash algorithm must be SHA-256", {
        datasetId: dataset.id
      });
    }
    if (typeof hash.hashValue !== "string" || !/^[a-f0-9]{64}$/.test(hash.hashValue)) {
      fail("MANIFEST_SCHEMA_INVALID", "Runtime manifest hashValue must be lowercase SHA-256", {
        datasetId: dataset.id
      });
    }
    if (hash.normalization !== "none" || hash.lineEndingRule !== "exact-raw-bytes-lf") {
      fail("HASH_NORMALIZATION_UNSUPPORTED", "Runtime hash must use exact raw LF bytes without normalization", {
        datasetId: dataset.id
      });
    }
    assertIsoTimestamp(hash.generatedAt, `${context}.published.hash.generatedAt`);
    assertNonBlankString(hash.generationMethod, `${context}.published.hash.generationMethod`);

    if (
      dataset.candidateWorkflow.artifactPath !== null &&
      dataset.candidateWorkflow.artifactPath === dataset.published.artifactPath
    ) {
      fail("FORBIDDEN_RUNTIME_TARGET", "Candidate and Published artifact paths must not be the same", {
        datasetId: dataset.id
      });
    }
  }

  return manifest;
}

export function loadPublishedDatasets({
  rootDir = process.cwd(),
  manifestPath = DEFAULT_MANIFEST_PATH,
  readFile = fs.readFileSync
} = {}) {
  const absoluteManifestPath = resolveManifestPath(rootDir, manifestPath);
  const manifestBytes = readBytes(readFile, absoluteManifestPath, "MANIFEST_MISSING", "Runtime manifest");
  const manifest = validateRuntimeManifest(
    parseJson(manifestBytes, "MANIFEST_INVALID_JSON", "Runtime manifest", { manifestPath })
  );

  const datasets = {};
  for (const dataset of manifest.datasets) {
    const artifactPath = dataset.published.artifactPath;
    const absoluteArtifactPath = resolvePublishedPath(rootDir, artifactPath);
    const artifactBytes = readBytes(readFile, absoluteArtifactPath, "ARTIFACT_MISSING", "Published Artifact");
    if (artifactBytes.includes(0x0d)) {
      fail("LINE_ENDING_MISMATCH", "Published Artifact raw bytes must use LF line endings", {
        datasetId: dataset.id,
        artifactPath
      });
    }
    const actualHash = sha256(artifactBytes);
    if (actualHash !== dataset.published.hash.hashValue) {
      fail("HASH_MISMATCH", "Published Artifact raw bytes do not match the Runtime manifest", {
        datasetId: dataset.id,
        artifactPath,
        expectedHash: dataset.published.hash.hashValue,
        actualHash
      });
    }
    const data = parseJson(artifactBytes, "ARTIFACT_INVALID_JSON", "Published Artifact", {
      datasetId: dataset.id,
      artifactPath
    });
    datasets[dataset.id] = {
      data,
      artifactPath,
      hashValue: actualHash,
      approvalBaseline: dataset.published.approval.baselineId
    };
  }

  return deepFreeze({
    manifestId: manifest.manifestId,
    schemaVersion: manifest.schemaVersion,
    datasets
  });
}

function publicError(error) {
  if (error instanceof RuntimeManifestError) {
    return Object.freeze({ code: error.code, message: error.message });
  }
  return Object.freeze({ code: "RUNTIME_MANIFEST_UNEXPECTED", message: "Runtime manifest loading failed" });
}

export function createRuntimeDatasetProvider({
  rootDir = process.cwd(),
  manifestPath = DEFAULT_MANIFEST_PATH,
  legacyLoader,
  loader = loadPublishedDatasets
} = {}) {
  if (typeof legacyLoader !== "function") {
    throw new TypeError("createRuntimeDatasetProvider requires a legacyLoader function");
  }
  if (typeof loader !== "function") {
    throw new TypeError("createRuntimeDatasetProvider loader must be a function");
  }

  let lastKnownGood = null;

  function loadLegacy(error = null) {
    try {
      return deepFreeze({ mode: error ? "safe-fallback" : "legacy", snapshot: legacyLoader(), error });
    } catch (legacyError) {
      fail(
        "SAFE_FALLBACK_FAILED",
        "Approved legacy baseline could not be loaded",
        { manifestErrorCode: error?.code ?? null },
        { cause: legacyError }
      );
    }
  }

  return Object.freeze({
    load(featureFlags = DEFAULT_FEATURE_FLAGS) {
      const flags = resolveFeatureFlags(featureFlags);
      if (!flags.runtimeManifestLoader) return loadLegacy();

      try {
        const snapshot = loader({ rootDir, manifestPath });
        lastKnownGood = deepFreeze(snapshot);
        return deepFreeze({ mode: "manifest", snapshot: lastKnownGood, error: null });
      } catch (error) {
        const reportedError = publicError(error);
        if (lastKnownGood) {
          return deepFreeze({ mode: "rollback", snapshot: lastKnownGood, error: reportedError });
        }
        return loadLegacy(reportedError);
      }
    },
    getLastKnownGood() {
      return lastKnownGood;
    }
  });
}
