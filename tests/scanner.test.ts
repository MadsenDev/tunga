import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/core/config.js";
import { scanSource } from "../src/core/scanner.js";

describe("scanner", () => {
  it("detects UI strings and ignores noisy values", () => {
    const candidates = scanSource(
      `const el=<><button>Save</button><input placeholder="Search products" className="text-sm font-bold" /></>;
const title="Dashboard"; const route="/settings"; const label=\`Settings\`; t("ui.save")`,
      { file: "src/Header.tsx", config: defaultConfig },
    );

    expect(candidates.map((candidate) => candidate.text)).toEqual(["Save", "Search products", "Dashboard", "Settings"]);
  });

  it("detects component names for component key generation", () => {
    const candidates = scanSource(`export function ProductCard(){return <button>Add to cart</button>}`, {
      file: "src/ProductCard.tsx",
      config: { ...defaultConfig, keyStrategy: "component" },
    });

    expect(candidates[0]?.componentName).toBe("ProductCard");
    expect(candidates[0]?.keySuggestion).toBe("ui.product_card.add_to_cart");
  });

  it("ignores strings already handled by common localization APIs", () => {
    const candidates = scanSource(
      `t("ui.save"); translate("ui.cancel"); i18n.t("ui.open"); intl.formatMessage({ id: "ui.close" }); formatMessage({ id: "ui.next" }); t.rich("ui.bold"); useTranslations("Settings"); const label = "Visible";`,
      { file: "src/Header.tsx", config: defaultConfig },
    );

    expect(candidates.map((candidate) => candidate.text)).toEqual(["Visible"]);
  });
});
