/* =====================================================================
 * Canonical mini-DSL evaluator for flight-validation rules.
 *
 * SINGLE SOURCE OF TRUTH — this file is duplicated VERBATIM in:
 *   backend/src/common/expr/expr-eval.ts
 *   frontend/src/lib/expr/expr-eval.ts
 * (and, later, the desktop rule engine). Keep the copies byte-identical;
 * `node scripts/check-expr-sync.js` fails the build if they diverge.
 *
 * The same evaluator runs in three places so a rule behaves identically in
 * the admin "Test" button, the backend publish validation, and the desktop
 * engine during a flight: "what you test is what runs".
 *
 * SAFETY: no eval / Function. Admin-authored strings are tokenized and
 * interpreted over a fixed grammar — they can only read numbers/booleans
 * from the provided scope and compare them. No property access, no calls.
 *
 * Grammar (precedence low -> high):
 *   expr    := or
 *   or      := and ('||' and)*
 *   and     := cmp ('&&' cmp)*
 *   cmp     := add (('=='|'!='|'>'|'>='|'<'|'<=') add)*
 *   add     := mul (('+'|'-') mul)*
 *   mul     := unary (('*'|'/'|'%') unary)*
 *   unary   := ('!'|'-') unary | primary
 *   primary := number | 'true' | 'false' | ident | '(' expr ')'
 *   ident   := [A-Za-z_][A-Za-z0-9_]* ('[' [0-9]+ ']')?   // e.g. n1_pct[1]
 * ===================================================================== */

export type Scalar = number | boolean;
export type Scope = Record<string, Scalar | undefined>;

export interface EvalResult {
  /** truthiness of the evaluated expression (the "did it fire" answer) */
  result: boolean;
  /** raw evaluated value (may be a number for arithmetic-only expressions) */
  value: Scalar;
  /** only the variables referenced by the expression, with their values */
  resolved: Record<string, Scalar | undefined>;
  /** set when the expression could not be parsed or evaluated */
  error?: string;
}

export interface ValidateResult {
  ok: boolean;
  error?: string;
  /** distinct variable names referenced by the expression */
  variables: string[];
}

export interface SimpleExpr {
  alias: string;
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
  value: string;
}

// ----------------------------------------------------------------------
// Tokenizer
// ----------------------------------------------------------------------

type TokType = 'num' | 'bool' | 'ident' | 'op' | 'lparen' | 'rparen';
interface Token {
  type: TokType;
  value: string;
}

const OPERATORS = [
  '>=',
  '<=',
  '==',
  '!=',
  '&&',
  '||',
  '>',
  '<',
  '!',
  '+',
  '-',
  '*',
  '/',
  '%',
];

class ExprError extends Error {}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;
  const identRe = /^[A-Za-z_][A-Za-z0-9_]*(\[[0-9]+\])?/;
  const numRe = /^[0-9]+(\.[0-9]+)?/;

  while (i < n) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')' });
      i++;
      continue;
    }
    const rest = input.slice(i);
    const op = OPERATORS.find((o) => rest.startsWith(o));
    if (op) {
      tokens.push({ type: 'op', value: op });
      i += op.length;
      continue;
    }
    const numMatch = rest.match(numRe);
    if (numMatch) {
      tokens.push({ type: 'num', value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }
    const idMatch = rest.match(identRe);
    if (idMatch) {
      const word = idMatch[0];
      if (word === 'true' || word === 'false') {
        tokens.push({ type: 'bool', value: word });
      } else {
        tokens.push({ type: 'ident', value: word });
      }
      i += word.length;
      continue;
    }
    throw new ExprError(`Unexpected character '${ch}' at position ${i}`);
  }
  return tokens;
}

// ----------------------------------------------------------------------
// Parser (recursive descent) -> AST
// ----------------------------------------------------------------------

type Node =
  | { type: 'num'; value: number }
  | { type: 'bool'; value: boolean }
  | { type: 'var'; name: string }
  | { type: 'unary'; op: string; arg: Node }
  | { type: 'binary'; op: string; left: Node; right: Node };

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }
  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }
  private eatOp(...ops: string[]): string | null {
    const t = this.peek();
    if (t && t.type === 'op' && ops.includes(t.value)) {
      this.pos++;
      return t.value;
    }
    return null;
  }

  parse(): Node {
    const node = this.parseOr();
    if (this.pos < this.tokens.length) {
      throw new ExprError(
        `Unexpected token '${this.peek()!.value}' after expression`,
      );
    }
    return node;
  }

  private parseOr(): Node {
    let left = this.parseAnd();
    let op: string | null;
    while ((op = this.eatOp('||'))) {
      left = { type: 'binary', op, left, right: this.parseAnd() };
    }
    return left;
  }
  private parseAnd(): Node {
    let left = this.parseCmp();
    let op: string | null;
    while ((op = this.eatOp('&&'))) {
      left = { type: 'binary', op, left, right: this.parseCmp() };
    }
    return left;
  }
  private parseCmp(): Node {
    let left = this.parseAdd();
    let op: string | null;
    while ((op = this.eatOp('==', '!=', '>', '>=', '<', '<='))) {
      left = { type: 'binary', op, left, right: this.parseAdd() };
    }
    return left;
  }
  private parseAdd(): Node {
    let left = this.parseMul();
    let op: string | null;
    while ((op = this.eatOp('+', '-'))) {
      left = { type: 'binary', op, left, right: this.parseMul() };
    }
    return left;
  }
  private parseMul(): Node {
    let left = this.parseUnary();
    let op: string | null;
    while ((op = this.eatOp('*', '/', '%'))) {
      left = { type: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }
  private parseUnary(): Node {
    const op = this.eatOp('!', '-');
    if (op) {
      return { type: 'unary', op, arg: this.parseUnary() };
    }
    return this.parsePrimary();
  }
  private parsePrimary(): Node {
    const t = this.next();
    if (!t) throw new ExprError('Unexpected end of expression');
    if (t.type === 'num') return { type: 'num', value: Number(t.value) };
    if (t.type === 'bool') return { type: 'bool', value: t.value === 'true' };
    if (t.type === 'ident') return { type: 'var', name: t.value };
    if (t.type === 'lparen') {
      const inner = this.parseOr();
      const close = this.next();
      if (!close || close.type !== 'rparen') {
        throw new ExprError("Missing closing ')'");
      }
      return inner;
    }
    throw new ExprError(`Unexpected token '${t.value}'`);
  }
}

function parseToAst(expr: string): Node {
  const tokens = tokenize(expr);
  if (tokens.length === 0) throw new ExprError('Empty expression');
  return new Parser(tokens).parse();
}

// ----------------------------------------------------------------------
// Evaluation
// ----------------------------------------------------------------------

function collectVars(node: Node, acc: Set<string>): void {
  switch (node.type) {
    case 'var':
      acc.add(node.name);
      break;
    case 'unary':
      collectVars(node.arg, acc);
      break;
    case 'binary':
      collectVars(node.left, acc);
      collectVars(node.right, acc);
      break;
  }
}

function toNum(v: Scalar): number {
  return typeof v === 'boolean' ? (v ? 1 : 0) : v;
}
function toBool(v: Scalar): boolean {
  return typeof v === 'boolean' ? v : v !== 0;
}

function evalNode(node: Node, scope: Scope): Scalar {
  switch (node.type) {
    case 'num':
      return node.value;
    case 'bool':
      return node.value;
    case 'var': {
      const v = scope[node.name];
      if (v === undefined || v === null) {
        throw new ExprError(`Unknown variable '${node.name}'`);
      }
      return typeof v === 'boolean' ? v : Number(v);
    }
    case 'unary': {
      const arg = evalNode(node.arg, scope);
      return node.op === '!' ? !toBool(arg) : -toNum(arg);
    }
    case 'binary': {
      const op = node.op;
      if (op === '&&') return toBool(evalNode(node.left, scope)) && toBool(evalNode(node.right, scope));
      if (op === '||') return toBool(evalNode(node.left, scope)) || toBool(evalNode(node.right, scope));
      const l = evalNode(node.left, scope);
      const r = evalNode(node.right, scope);
      switch (op) {
        case '==':
          return toNum(l) === toNum(r);
        case '!=':
          return toNum(l) !== toNum(r);
        case '>':
          return toNum(l) > toNum(r);
        case '>=':
          return toNum(l) >= toNum(r);
        case '<':
          return toNum(l) < toNum(r);
        case '<=':
          return toNum(l) <= toNum(r);
        case '+':
          return toNum(l) + toNum(r);
        case '-':
          return toNum(l) - toNum(r);
        case '*':
          return toNum(l) * toNum(r);
        case '/':
          return toNum(l) / toNum(r);
        case '%':
          return toNum(l) % toNum(r);
      }
      throw new ExprError(`Unknown operator '${op}'`);
    }
  }
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

/** Evaluate an expression against a frame of values. Never throws. */
export function evaluateExpr(expr: string, scope: Scope): EvalResult {
  const resolved: Record<string, Scalar | undefined> = {};
  try {
    const ast = parseToAst(expr);
    const vars = new Set<string>();
    collectVars(ast, vars);
    vars.forEach((name) => {
      resolved[name] = scope[name];
    });
    const value = evalNode(ast, scope);
    return { result: toBool(value), value, resolved };
  } catch (e) {
    return {
      result: false,
      value: false,
      resolved,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Parse-check an expression (for the "Publish" validation). Never throws. */
export function validateExpr(expr: string): ValidateResult {
  try {
    const ast = parseToAst(expr);
    const vars = new Set<string>();
    collectVars(ast, vars);
    return { ok: true, variables: Array.from(vars) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      variables: [],
    };
  }
}

/** Distinct variables referenced by an expression ([] if it does not parse). */
export function extractVariables(expr: string): string[] {
  return validateExpr(expr).variables;
}

const SIMPLE_RE =
  /^\s*([A-Za-z_][A-Za-z0-9_]*(?:\[[0-9]+\])?)\s*(>=|<=|==|!=|>|<)\s*(-?[0-9]+(?:\.[0-9]+)?)\s*$/;

/**
 * If the expression is a single `alias OP number` comparison, return its parts
 * so the guided builder can round-trip it; otherwise null (advanced mode).
 */
export function parseSimpleExpr(expr: string): SimpleExpr | null {
  const m = expr.match(SIMPLE_RE);
  if (!m) return null;
  return {
    alias: m[1],
    operator: m[2] as SimpleExpr['operator'],
    value: m[3],
  };
}
