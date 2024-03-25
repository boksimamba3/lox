import {
  AssignExpression,
  BinaryExpression,
  CallExpression,
  Expression,
  ExpressionVisitor,
  GroupingExpression,
  LiteralExpression,
  LogicalExpression,
  UnaryExpression,
  VariableExpression,
} from "../ast/expression";
import {
  BlockStatement,
  ClassStatement,
  ExpressionStatement,
  FunctionStatement,
  IfStatement,
  PrintStatement,
  ReturnStatement,
  Statement,
  StatementVisitor,
  VariableStatement,
  WhileStatement,
} from "../ast/statement";
import { Token } from "../ast/token";
import { Interpreter } from "../interpreter/interpreter";

const enum FunctionType {
  NONE,
  FUNCTION,
}

export class Resolve
  implements ExpressionVisitor<void>, StatementVisitor<void>
{
  private readonly scopes: Map<string, boolean>[] = [];
  private currentFunction: FunctionType = FunctionType.NONE;

  constructor(private readonly interpreter: Interpreter) {}

  visitExpressionStatement(stmt: ExpressionStatement): void {
    this.resolve(stmt.expression);
  }

  visitPrintStatement(stmt: PrintStatement): void {
    this.resolve(stmt.expression);
  }

  visitVariableStatement(stmt: VariableStatement): void {
    this.declare(stmt.name);
    if (stmt.initializer !== null) {
      this.resolve(stmt.initializer);
    }
    this.define(stmt.name);
  }

  visitBlockStatement(stmt: BlockStatement): void {
    this.beginScope();
    this.resolve(stmt.stmts);
    this.endScope();
  }

  visitClassStatement(stmt: ClassStatement): void {
    this.declare(stmt.name);
    this.define(stmt.name);
  }

  visitFunctionStatement(stmt: FunctionStatement): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  visitReturnStatement(stmt: ReturnStatement): void {
    if (this.currentFunction === FunctionType.NONE)
      this.error("Can't return from top-level code.");

    if (stmt.value !== null) this.resolve(stmt.value);
  }

  visitIfStatement(stmt: IfStatement): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);

    if (stmt.elseBranch !== null) this.resolve(stmt.elseBranch);
  }

  visitWhileStatement(stmt: WhileStatement): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  visitAssignExpression(expr: AssignExpression): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  visitBinaryExpression(expr: BinaryExpression): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitGroupingExpression(expr: GroupingExpression): void {
    this.resolve(expr.expression);
  }

  visitLiteralExpression(expr: LiteralExpression): void {}

  visitUnaryExpression(expr: UnaryExpression): void {
    this.resolve(expr.right);
  }

  visitVariableExpression(expr: VariableExpression): void {
    if (
      this.scopes.length > 0 &&
      this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === false
    ) {
      this.error(`Can't read local variable and its own initializer.`);
    }

    this.resolveLocal(expr, expr.name);
  }

  visitLogicalExpression(expr: LogicalExpression): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitCallExpression(expr: CallExpression): void {
    this.resolve(expr.callee);

    for (const arg of expr.args) {
      this.resolve(arg);
    }
  }

  private declare(name: Token) {
    if (this.scopes.length === 0) return;

    const scope: Map<string, boolean> = this.scopes[this.scopes.length - 1];

    if (scope.has(name.lexeme))
      this.error(`Already a variable with ${name.lexeme} in this scope.`);

    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (this.scopes.length === 0) return;

    const scope: Map<string, boolean> = this.scopes[this.scopes.length - 1];

    scope.set(name.lexeme, true);
  }

  resolve(stmts: Statement[]): void;
  resolve(stmt: Statement): void;
  resolve(expr: Expression): void;
  resolve(stmtOrExpr: Statement | Statement[] | Expression) {
    if (Array.isArray(stmtOrExpr)) {
      for (let stmt of stmtOrExpr) {
        this.resolve(stmt);
      }
    } else {
      stmtOrExpr.accept(this);
    }
  }

  private resolveLocal(expr: Expression, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private resolveFunction(fn: FunctionStatement, type: FunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;
    this.beginScope();

    for (const param of fn.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(fn.body);

    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope(): void {
    this.scopes.push(new Map<string, boolean>());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private error(message: string): never {
    throw new SyntaxError(`${message}`);
  }
}
