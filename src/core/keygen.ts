import path from "node:path"; import type { KeyStrategy } from "../types/index.js";
export function slugify(text:string){ return text.trim().toLowerCase().replace(/['"]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,48) || "text"; }
export function pathSegment(file:string){ const base=path.basename(file,path.extname(file)); return slugify(base.replace(/\.(test|spec)$/,"")); }
export function generateKey(text:string, opts:{file:string; namespace:string; strategy:KeyStrategy; componentName?:string}){ const leaf=slugify(text); if(opts.strategy==="text") return `${opts.namespace}.${leaf}`; const scope=opts.strategy==="component" && opts.componentName ? slugify(opts.componentName) : pathSegment(opts.file); return `${opts.namespace}.${scope}.${leaf}`; }
export function uniqueKey(key:string, value:string, existing:Record<string,unknown>){ const cur=getNested(existing,key); if(cur===undefined || cur===value) return key; let i=2; while(getNested(existing,`${key}_${i}`)!==undefined) i++; return `${key}_${i}`; }
export function getNested(obj:any,key:string){ return key.split('.').reduce((a,p)=>a?.[p],obj); }
