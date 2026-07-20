import type { GmgnResult, GmgnError } from "../types";

export function unwrapGmgnResult<T>(result: GmgnResult<T>): T | null {
  if (result.success) return result.data;
  return null;
}

export function getGmgnErrorMessage(result: GmgnResult<unknown>): string | null {
  if (!result.success) {
    return "Additional market intelligence is temporarily unavailable. Live on-chain data remains available.";
  }
  return null;
}

export function getGmgnError(result: GmgnResult<unknown>): GmgnError | null {
  return result.success ? null : result.error;
}
