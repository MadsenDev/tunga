export type CandidateType = "jsx-text" | "jsx-attribute" | "string-literal" | "template-literal";
export type Confidence = "high" | "medium" | "low";
export type KeyStrategy = "path" | "text" | "component";
export type ImportKind = "named" | "default";

export type CandidateString = {
  id: string;
  text: string;
  file: string;
  line: number;
  column: number;
  context: string;
  type: CandidateType;
  keySuggestion: string;
  confidence: Confidence;
  componentName?: string;
  reason?: string;
};

export type TungaConfig = {
  include: string[];
  ignore: string[];
  locale: string;
  functionName: string;
  importSource: string;
  importKind: ImportKind;
  keyStrategy: KeyStrategy;
  namespace: string;
  scan: {
    jsxText: boolean;
    jsxAttributes: boolean;
    stringLiterals: boolean;
    templateLiterals: boolean;
  };
  filters: {
    minLength: number;
    ignoreRoutes: boolean;
    ignoreClassNames: boolean;
    ignoreNumbers: boolean;
    ignorePunctuationOnly: boolean;
  };
};

export type ScanOptions = Partial<TungaConfig> & { cwd?: string; paths?: string[] };
