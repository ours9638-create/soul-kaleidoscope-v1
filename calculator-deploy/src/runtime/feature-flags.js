const FEATURE_FLAG_KEYS = Object.freeze(["runtimeManifestLoader"]);

export const DEFAULT_FEATURE_FLAGS = Object.freeze({
  runtimeManifestLoader: false
});

export function resolveFeatureFlags(overrides = {}) {
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("Feature flag overrides must be an object");
  }

  const unknownKeys = Object.keys(overrides).filter((key) => !FEATURE_FLAG_KEYS.includes(key));
  if (unknownKeys.length) {
    throw new TypeError(`Unknown feature flag: ${unknownKeys.join(", ")}`);
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value !== "boolean") {
      throw new TypeError(`Feature flag ${key} must be boolean`);
    }
  }

  return Object.freeze({ ...DEFAULT_FEATURE_FLAGS, ...overrides });
}
