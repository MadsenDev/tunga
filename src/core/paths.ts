import path from "node:path"; export const resolveCwd=(p:string,cwd=process.cwd())=>path.isAbsolute(p)?p:path.join(cwd,p);
