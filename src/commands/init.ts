import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { configTemplate } from "../core/config.js";
import { endTui, showNote, startTui, success } from "../output/tui.js";

export async function initCommand() {
  startTui("Tunga init");

  const file = path.join(process.cwd(), "tunga.config.ts");
  if (existsSync(file)) {
    throw new Error("tunga.config.ts already exists");
  }

  writeFileSync(file, configTemplate());
  success("Created tunga.config.ts");
  showNote("Next steps:\n  tunga scan\n  tunga extract --dry-run\n  tunga apply --dry-run", "Workflow");
  endTui("Configuration ready.");
}
