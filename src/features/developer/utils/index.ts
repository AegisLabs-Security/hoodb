import type { GmgnResult, GmgnError } from "../types";

export function unwrapGmgnResult<T>(result: GmgnResult<T>): T | null {
  if (result.success) return result.data;
  console.error("GMGN Error:", result.error);
  return null;
}

export function getGmgnErrorMessage(result: GmgnResult<unknown>): string | null {
  if (!result.success) {
    return `${result.error.code}: ${result.error.message}`;
  }
  return null;
}
