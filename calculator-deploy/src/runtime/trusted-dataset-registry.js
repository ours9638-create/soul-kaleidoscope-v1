function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") deepFreeze(child);
  }
  return Object.freeze(value);
}

export const TRUSTED_DATASET_REGISTRY = deepFreeze({
  "number-topic": {
    approvedPath: "data/sngl/numbers.v1.json",
    approvedBaselineId: "approved-consumer-baseline",
    approvedEvidencePath: "Records/consumer-baseline/r2/R2_FINAL_CLOSEOUT.md",
    consumerContract: {
      rootProperty: "numbers",
      requiredRecordIds: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      requiredStringFields: ["title", "core", "mature", "imbalance", "action", "geometry"],
      requiredStringArrayFields: ["colors"]
    }
  },
  position: {
    approvedPath: "data/sngl/positions.v1.json",
    approvedBaselineId: "approved-consumer-baseline",
    approvedEvidencePath: "Records/consumer-baseline/r2/R2_FINAL_CLOSEOUT.md",
    consumerContract: {
      rootProperty: "positions",
      requiredRecordIds: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      requiredStringFields: ["title", "phase", "observation", "mature", "imbalance", "action"],
      requiredStringArrayFields: []
    }
  }
});

export const REQUIRED_DATASET_IDS = Object.freeze(Object.keys(TRUSTED_DATASET_REGISTRY));
