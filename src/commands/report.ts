import { loadConfig } from "../core/config.js";
import { findSourceFiles, scanProject } from "../core/scanner.js";
import { printJson } from "../output/json.js";
import { createSpinner, endTui, showNote, startTui } from "../output/tui.js";

export async function reportCommand(opts: { json?: boolean }) {
  const config = await loadConfig();
  const spinner = !opts.json ? createSpinner("Building localization report") : undefined;
  const files = await findSourceFiles(config);
  const candidates = await scanProject(config);
  const report = {
    filesScanned: files.length,
    localizedStrings: 0,
    hardcodedCandidates: candidates.length,
    missingLocaleKeys: 0,
    unusedLocaleKeys: 0,
  };

  spinner?.stop("Report ready");

  if (opts.json) {
    console.log(printJson(report));
    return;
  }

  startTui("Tunga report");
  showNote(
    [
      `Files scanned: ${report.filesScanned}`,
      `Localized strings: ${report.localizedStrings}`,
      `Hardcoded candidates: ${report.hardcodedCandidates}`,
      `Missing locale keys: ${report.missingLocaleKeys}`,
      `Unused locale keys: ${report.unusedLocaleKeys}`,
    ].join("\n"),
    "Localization report",
  );
  endTui("Report complete.");
}
