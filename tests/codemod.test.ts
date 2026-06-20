import { expect, it } from "vitest";
import { applyCodemod } from "../src/core/codemod.js";
import { defaultConfig } from "../src/core/config.js";

it("wraps JSX text with t call and import", () => {
  const result = applyCodemod({
    source: `export function A(){return <button>Save</button>}`,
    config: defaultConfig,
    candidates: [{ text: "Save", keySuggestion: "ui.save", confidence: "high" }],
  });

  expect(result.code).toContain(`import { t } from "@/i18n"`);
  expect(result.code).toContain(`<button>{t("ui.save")}</button>`);
});

it("rewrites JSX attributes", () => {
  const result = applyCodemod({
    source: `const x=<input placeholder="Search" />`,
    config: defaultConfig,
    candidates: [{ text: "Search", keySuggestion: "ui.search", confidence: "high" }],
    skipImport: true,
  });

  expect(result.code).toContain(`placeholder={t("ui.search")}`);
});

it("uses location-aware matching when locations are available", () => {
  const source = `export function A(){return <><button>Open</button><h1>Open</h1></>}`;
  const result = applyCodemod({
    source,
    config: defaultConfig,
    skipImport: true,
    candidates: [{ text: "Open", keySuggestion: "ui.heading.open", confidence: "high", line: 1, column: 54, type: "jsx-text" }],
  });

  expect(result.code).toContain(`<button>Open</button>`);
  expect(result.code).toContain(`<h1>{t("ui.heading.open")}</h1>`);
});
