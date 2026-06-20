import type { CandidateString } from "../types/index.js";
import { reviewCandidate } from "../output/tui.js";

export async function reviewCandidates(candidates: CandidateString[]) {
  const accepted: CandidateString[] = [];

  for (const candidate of candidates) {
    const decision = await reviewCandidate(candidate);

    if (decision.action === "accept") {
      accepted.push({ ...candidate, keySuggestion: decision.key });
    }
  }

  return accepted;
}
