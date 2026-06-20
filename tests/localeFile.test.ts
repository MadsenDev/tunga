import { expect,it } from "vitest"; import { addCandidates } from "../src/core/localeFile.js";
it("adds nested keys without overwriting",()=>{ const locale={ui:{save:"Save"}}; const {added}=addCandidates(locale,[{text:"Save changes",keySuggestion:"ui.save"} as any]); expect(added[0].key).toBe("ui.save_2"); expect((locale as any).ui.save).toBe("Save"); });
