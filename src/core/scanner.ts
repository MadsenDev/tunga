import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import fg from "fast-glob";
import type { CandidateString, TungaConfig } from "../types/index.js";
import { mergeConfig } from "./config.js";
import { confidenceFor, shouldIgnoreString } from "./filters.js";
import { generateKey } from "./keygen.js";

const traverse = (traverseModule as any).default ?? traverseModule;
const LOCALIZATION_FUNCTIONS = new Set([
  "t",
  "translate",
  "formatMessage",
  "useTranslations",
]);
const LOCALIZATION_METHODS = new Set(["t", "rich", "formatMessage"]);

export async function findSourceFiles(config: TungaConfig, cwd = process.cwd(), paths?: string[]) {
  const patterns = paths?.length ? paths : config.include;
  return fg(patterns, { cwd, absolute: true, ignore: config.ignore, onlyFiles: true });
}

export async function scanProject(input: Partial<TungaConfig> & { cwd?: string; paths?: string[] } = {}) {
  const config = mergeConfig(input);
  const cwd = input.cwd ?? process.cwd();
  const files = await findSourceFiles(config, cwd, input.paths);
  return (await Promise.all(files.map((file) => scanFile(file, config, cwd)))).flat();
}

export function scanFile(file: string, config: TungaConfig, cwd = process.cwd()): CandidateString[] {
  const source = readFileSync(file, "utf8");
  return scanSource(source, { file: path.relative(cwd, file), config });
}

export function scanSource(source: string, { file, config }: { file: string; config: TungaConfig }) {
  const ast = parse(source, { sourceType: "module", plugins: ["jsx", "typescript"] });
  const candidates: CandidateString[] = [];

  function addCandidate(node: t.Node, text: string, type: CandidateString["type"], context: string, nodePath: NodePath) {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const reason = shouldIgnoreString(cleanText, config);
    if (reason) return;

    const loc = node.loc?.start ?? { line: 1, column: 0 };
    const componentName = findComponentName(nodePath);

    candidates.push({
      id: `${file}:${loc.line}:${loc.column}:${type}`,
      text: cleanText,
      file,
      line: loc.line,
      column: loc.column,
      context,
      type,
      componentName,
      keySuggestion: generateKey(cleanText, {
        file,
        namespace: config.namespace,
        strategy: config.keyStrategy,
        componentName,
      }),
      confidence: confidenceFor(cleanText),
    });
  }

  traverse(ast, {
    JSXText(nodePath: NodePath<t.JSXText>) {
      if (config.scan.jsxText) {
        addCandidate(nodePath.node, nodePath.node.value, "jsx-text", "JSX text", nodePath);
      }
    },
    JSXAttribute(nodePath: NodePath<t.JSXAttribute>) {
      if (config.scan.jsxAttributes && t.isStringLiteral(nodePath.node.value)) {
        addCandidate(
          nodePath.node.value,
          nodePath.node.value.value,
          "jsx-attribute",
          `JSX attribute ${String(nodePath.node.name.name)}`,
          nodePath,
        );
      }
    },
    StringLiteral(nodePath: NodePath<t.StringLiteral>) {
      if (!config.scan.stringLiterals || isExistingLocalization(nodePath, config)) return;
      if (nodePath.parentPath.isImportDeclaration() || nodePath.parentPath.isExportNamedDeclaration()) return;
      if (nodePath.findParent((parent) => parent.isJSXAttribute())) return;
      addCandidate(nodePath.node, nodePath.node.value, "string-literal", "String literal", nodePath);
    },
    TemplateLiteral(nodePath: NodePath<t.TemplateLiteral>) {
      if (!config.scan.templateLiterals || nodePath.node.expressions.length > 0) return;
      if (isExistingLocalization(nodePath, config)) return;
      addCandidate(
        nodePath.node,
        nodePath.node.quasis[0]?.value.cooked ?? "",
        "template-literal",
        "Template literal",
        nodePath,
      );
    },
  });

  return candidates;
}

function isExistingLocalization(nodePath: NodePath, config: TungaConfig) {
  const callExpression = nodePath.findParent((parent) => parent.isCallExpression()) as NodePath<t.CallExpression> | null;
  if (!callExpression) return false;

  const callee = callExpression.node.callee;
  if (t.isIdentifier(callee)) {
    return callee.name === config.functionName || LOCALIZATION_FUNCTIONS.has(callee.name);
  }

  if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
    if (LOCALIZATION_METHODS.has(callee.property.name)) return true;
    return t.isIdentifier(callee.object, { name: "intl" }) && callee.property.name === "formatMessage";
  }

  return false;
}

function findComponentName(nodePath: NodePath) {
  const functionParent = nodePath.findParent(
    (parent) => parent.isFunctionDeclaration() || parent.isFunctionExpression() || parent.isArrowFunctionExpression(),
  );

  if (!functionParent) return undefined;
  const node = functionParent.node;

  if ((t.isFunctionDeclaration(node) || t.isFunctionExpression(node)) && node.id?.name) {
    return node.id.name;
  }

  const parent = functionParent.parentPath;
  if (parent?.isVariableDeclarator() && t.isIdentifier(parent.node.id)) {
    return parent.node.id.name;
  }

  return undefined;
}
