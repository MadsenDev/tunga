import prettier from "prettier";
export async function formatCode(code:string,filePath:string){ try { const cfg=await prettier.resolveConfig(filePath); return await prettier.format(code,{...(cfg??{}),filepath:filePath}); } catch { return code; } }
