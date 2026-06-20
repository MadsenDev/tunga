import { parse } from "@babel/parser";
import generateModule from "@babel/generator";
import traverseModule from "@babel/traverse";
import * as t from "@babel/types";
import type { CandidateString, TungaConfig } from "../types/index.js";
import { ensureImport } from "./imports.js";

const traverse = (traverseModule as any).default ?? traverseModule;
const generate = (generateModule as any).default ?? generateModule;

type ReplacementCandidate = Pick<CandidateString, "text" | "keySuggestion" | "confidence"> &
  Partial<Pick<CandidateString, "line" | "column" | "type">>;

export function applyCodemod(opts: {
  source: string;
  candidates: ReplacementCandidate[];
  config: TungaConfig;
  skipImport?: boolean;
  includeLowConfidence?: boolean;
}) {
  const ast = parse(opts.source, { sourceType: "module", plugins: ["jsx", "typescript"] });
  const candidates = opts.candidates.filter((candidate) => candidate.confidence !== "low" || opts.includeLowConfidence);
  const byLocation = new Map(candidates.filter(hasLocation).map((candidate) => [locationKey(candidate), candidate]));
  const byText = new Map(candidates.filter((candidate) => !hasLocation(candidate)).map((candidate) => [candidate.text, candidate]));
  let changed = false;

  function call(key: string) {
    return t.callExpression(t.identifier(opts.config.functionName), [t.stringLiteral(key)]);
  }

  function match(node: t.Node, text: string, type: CandidateString["type"]) {
    const loc = node.loc?.start;
    const cleanText = text.replace(/\s+/g, " ").trim();

    if (loc) {
      const located = byLocation.get(`${loc.line}:${loc.column}:${type}`);
      if (located?.text === cleanText) return located;
    }

    return byText.get(cleanText);
  }

  traverse(ast, {
    JSXText(nodePath: any) {
      const candidate = match(nodePath.node, nodePath.node.value, "jsx-text");
      if (!candidate) return;
      nodePath.replaceWith(t.jsxExpressionContainer(call(candidate.keySuggestion)));
      changed = true;
    },
    JSXAttribute(nodePath: any) {
      if (!t.isStringLiteral(nodePath.node.value)) return;
      const candidate = match(nodePath.node.value, nodePath.node.value.value, "jsx-attribute");
      if (!candidate) return;
      nodePath.node.value = t.jsxExpressionContainer(call(candidate.keySuggestion));
      changed = true;
    },
    StringLiteral(nodePath: any) {
      if (nodePath.parentPath.isImportDeclaration() || nodePath.parentPath.isCallExpression()) return;
      if (nodePath.findParent((parent: any) => parent.isJSXAttribute())) return;

      const candidate = match(nodePath.node, nodePath.node.value, "string-literal");
      if (!candidate) return;
      nodePath.replaceWith(call(candidate.keySuggestion));
      changed = true;
    },
    TemplateLiteral(nodePath: any) {
      if (nodePath.node.expressions.length > 0) return;
      const candidate = match(nodePath.node, nodePath.node.quasis[0]?.value.cooked ?? "", "template-literal");
      if (!candidate) return;
      nodePath.replaceWith(call(candidate.keySuggestion));
      changed = true;
    },
  });

  if (changed && !opts.skipImport) ensureImport(ast.program, opts.config);
  return { code: generate(ast, { jsescOption: { minimal: true } }).code, changed };
}

function hasLocation(candidate: ReplacementCandidate) {
  return candidate.line !== undefined && candidate.column !== undefined && candidate.type !== undefined;
}

function locationKey(candidate: ReplacementCandidate) {
  return `${candidate.line}:${candidate.column}:${candidate.type}`;
}
