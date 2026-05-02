import { existsSync } from "node:fs";
import path from "node:path";

export const MIRROR_OUTPUT_ROOT = path.join(process.cwd(), "data", "source");

export function getExternalOutputRoot() {
  const root = process.env.NK_EXTERNAL_OUTPUT_ROOT;

  if (!root) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("NK_EXTERNAL_OUTPUT_ROOT is required when local mirrored data is not available.");
    }

    throw new Error("NK_EXTERNAL_OUTPUT_ROOT is not configured.");
  }

  return root;
}

export function resolveDataRoot() {
  if (process.env.NK_DATA_ROOT) {
    return process.env.NK_DATA_ROOT;
  }

  if (existsSync(path.join(MIRROR_OUTPUT_ROOT, "hanimeIndex.json"))) {
    return MIRROR_OUTPUT_ROOT;
  }

  return getExternalOutputRoot();
}

export function isMirrorAvailable() {
  return existsSync(path.join(MIRROR_OUTPUT_ROOT, "hanimeIndex.json"));
}
