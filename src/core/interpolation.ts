import generateModule from "@babel/generator";
import * as t from "@babel/types";

const generate = (generateModule as any).default ?? generateModule;

export type Interpolation = {
  name: string;
  expression: string;
};

export function simpleExpression(node: t.Node): { expression: string; preferredName: string } | undefined {
  if (t.isIdentifier(node)) return { expression: node.name, preferredName: node.name };
  if (t.isMemberExpression(node) && !node.computed) {
    const parts = memberParts(node);
    if (!parts) return undefined;
    return { expression: generate(node).code, preferredName: parts.at(-1) ?? "value" };
  }
  return undefined;
}

function memberParts(node: t.MemberExpression): string[] | undefined {
  const object = t.isMemberExpression(node.object) ? memberParts(node.object) : t.isIdentifier(node.object) ? [node.object.name] : undefined;
  if (!object || !t.isIdentifier(node.property)) return undefined;
  return [...object, node.property.name];
}

export function uniquePlaceholder(preferredName: string, used: Set<string>) {
  const base = preferredName.replace(/[^A-Za-z0-9_$]/g, "") || "value";
  let name = base;
  let i = 2;
  while (used.has(name)) name = `${base}${i++}`;
  used.add(name);
  return name;
}

export function interpolationObject(items: Interpolation[]) {
  return t.objectExpression(
    items.map((item) =>
      item.name === item.expression && /^[A-Za-z_$][\w$]*$/.test(item.name)
        ? t.objectProperty(t.identifier(item.name), t.identifier(item.name), false, true)
        : t.objectProperty(t.identifier(item.name), parseExpression(item.expression)),
    ),
  );
}

function parseExpression(expression: string) {
  // Expressions are generated from an already parsed simple Identifier/MemberExpression.
  return expression.split(".").reduce<t.Expression | undefined>((acc, part) => {
    if (!acc) return t.identifier(part);
    return t.memberExpression(acc, t.identifier(part));
  }, undefined) ?? t.identifier(expression);
}
