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
import { TokenType } from "../ast/token_type";
import { Environment } from "./environment";
import { LoxCallable } from "./lox_callable";
import { LoxFunction } from "./lox_function";
import { LoxValue } from "./lox_object";
import { LoxReturn } from "./lox-return";
import { LoxClass } from "./lox_class";

function isLoxCallable(object: Object | null): object is LoxCallable {
  return !!object && "call" in object && typeof object.call === "function";
}

export class Interpreter
  implements ExpressionVisitor<Object | null>, StatementVisitor<void>
{
  readonly globals = new Environment();
  private environment = this.globals;

  private readonly locals = new Map<Expression, number>();

  constructor() {
    this.globals.define("clock", {
      arity: () => 0,
      call: () => Date.now(),
    });
  }

  interpret(stmts: Statement[]): void {
    try {
      for (const stmt of stmts) {
        this.execute(stmt);
      }
    } catch (err) {
      throw new Error("Runtime error.");
    }
  }

  private execute(stmt: Statement) {
    stmt.accept(this);
  }

  private evaluate(expr: Expression): Object | null {
    return expr.accept(this);
  }

  resolve(expr: Expression, depth: number) {
    this.locals.set(expr, depth);
  }

  visitBlockStatement(stmt: BlockStatement): null {
    this.executeBlock(stmt.stmts, new Environment(this.environment));

    return null;
  }

  visitClassStatement(stmt: ClassStatement): null {
    this.environment.define(stmt.name.lexeme, null);
    const cls = new LoxClass(stmt.name.lexeme);
    this.environment.assign(stmt.name, cls);

    return null;
  }

  visitFunctionStatement(stmt: FunctionStatement): null {
    const fn = new LoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, fn);

    return null;
  }

  visitReturnStatement(stmt: ReturnStatement): void {
    let value: LoxValue = null;
    if (stmt.value) value = this.evaluate(stmt.value);

    throw new LoxReturn(value);
  }

  visitExpressionStatement(stmt: ExpressionStatement): void {
    this.evaluate(stmt.expression);
  }

  executeBlock(stmts: Statement[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (let stmt of stmts) {
        this.execute(stmt);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitPrintStatement(stmt: PrintStatement): void {
    const value = this.evaluate(stmt.expression);

    console.log(this.stringify(value));
  }

  visitIfStatement(stmt: IfStatement): null {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }

    return null;
  }

  visitWhileStatement(stmt: WhileStatement): null {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }

    return null;
  }

  visitVariableStatement(stmt: VariableStatement): void {
    let value = null;

    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  visitAssignExpression(expr: AssignExpression): Object | null {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }

  visitCallExpression(expr: CallExpression): Object | null {
    const callee = this.evaluate(expr.callee);

    const args: LoxValue[] = [];
    for (let arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!isLoxCallable(callee)) {
      throw new Error("Call only call functions and classes.");
    }

    const fn = <LoxCallable>callee;

    if (args.length !== fn.arity()) {
      throw new Error(
        `Expected ${fn.arity()} arguments but got ${args.length}.`
      );
    }

    return fn.call(this, args);
  }

  visitBinaryExpression(expr: BinaryExpression): Object {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    if (left === null || right === null) {
      throw Error("One of the operands is null.");
    }

    switch (expr.operator.type) {
      case TokenType.Greater:
        this.checkNumberOperands(left, right);

        return left > right;

      case TokenType.GreaterEqual:
        this.checkNumberOperands(left, right);

        return left >= right;

      case TokenType.Less:
        this.checkNumberOperands(left, right);

        return left < right;

      case TokenType.LessEqual:
        this.checkNumberOperands(left, right);

        return left <= right;

      case TokenType.BangEqual:
        return !this.isEqual(left, right);

      case TokenType.EqualEqual:
        return this.isEqual(left, right);

      case TokenType.Plus:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" || typeof right === "string") {
          return `${left}${right}`;
        }

        throw new Error("Operands must be 2 numbers or at least 1 strings.");

      case TokenType.Minus:
        this.checkNumberOperands(left, right);

        return +left - +right;

      case TokenType.Slash:
        this.checkNumberOperands(left, right);

        return +left / +right;

      case TokenType.Star:
        this.checkNumberOperands(left, right);
        return +left * +right;

      case TokenType.Percent:
        this.checkNumberOperands(left, right);

        return +left % +right;
    }

    // Unreachable.
    throw new Error("Unknown token type used as binary operator.");
  }

  visitLogicalExpression(expr: LogicalExpression): Object | null {
    const left = this.evaluate(expr.left);
    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left;
    } else if (!this.isTruthy(left)) return left;

    return this.evaluate(expr.right);
  }

  visitGroupingExpression(expr: GroupingExpression): Object | null {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpression(expr: LiteralExpression): Object {
    return expr.value;
  }

  visitUnaryExpression(expr: UnaryExpression): Object {
    const right: any = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.Bang:
        return !this.isTruthy(right);
      case TokenType.Minus:
        this.checkNumberOperand(right);
        return -right;
    }

    // Unreachable.
    throw new Error("Unknown token type used as unary operator.");
  }

  visitVariableExpression(expr: VariableExpression): Object | null {
    return this.lookUpVariable(expr.name, expr);
  }

  private lookUpVariable(name: Token, expr: Expression): Object | null {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    }

    return this.environment.get(name);
  }

  private checkNumberOperand(operand: Object) {
    if (typeof operand === "number") return;

    throw new Error("Operand must be a number.");
  }

  private checkNumberOperands(left: Object, right: Object) {
    if (typeof left === "number" && typeof right === "number") return;

    throw new Error("Operands must be numbers.");
  }

  private isTruthy(object: Object | null) {
    if (object === null) return false;
    if (typeof object === "boolean") return object;

    return true;
  }

  private isEqual(a: Object, b: Object) {
    return a === b;
  }

  private stringify(object: Object | null): string {
    if (object === null) return "nil";

    return object.toString();
  }
}
