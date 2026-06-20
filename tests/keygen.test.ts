import { expect,it } from "vitest"; import { generateKey, slugify } from "../src/core/keygen.js";
it("generates predictable keys",()=>{ expect(slugify("Save changes")).toBe("save_changes"); expect(generateKey("Search",{file:"src/components/Header.tsx",namespace:"ui",strategy:"path"})).toBe("ui.header.search"); });
