import type { CandidateString } from "../types/index.js";
import { renderCandidateTable } from "./tui.js";

export function formatScan(candidates: CandidateString[]) {
  return renderCandidateTable(candidates);
}
