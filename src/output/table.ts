export function table(rows:string[][]){ return rows.map(r=>r.join("  ")).join("\n"); }
