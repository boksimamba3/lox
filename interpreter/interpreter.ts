import {
  AssignExpression,
  BinaryExpression,
  Expression,
  ExpressionVisitor,
  GroupingExpression,
  LiteralExpression,
  UnaryExpression,
  VariableExpression,
} from '../ast/expression'
import {
  ExpressionStatement,
  PrintStatement,
  Statement,
  StatementVisitor,
  VariableStatement,
} from '../ast/statement'
import { Token } from '../ast/token'
import { TokenType } from '../ast/token_type'
import { Environment } from './environment'

export class Interpreter
  implements ExpressionVisitor<Object | null>, StatementVisitor<void>
{
  readonly globals = new Environment()
  private environment = this.globals

  interpret(stmts: Statement[]): void {
    try {
      for (const stmt of stmts) {
        this.execute(stmt)
      }
    } catch {
      throw new Error('Runtime error.')
    }
  }

  private execute(stmt: Statement) {
    stmt.accept(this)
  }

  private evaluate(expr: Expression): Object | null {
    return expr.accept(this)
  }

  visitExpressionStatement(stmt: ExpressionStatement): void {
    this.evaluate(stmt.expression)
  }

  visitPrintStatement(stmt: PrintStatement): void {
    const value = this.evaluate(stmt.expression)

    console.log(this.stringify(value))
  }

  visitVariableStatement(stmt: VariableStatement): void {
    let value = null

    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer)
    }

    this.environment.define(stmt.name.lexeme, value)
  }

  visitAssignExpression(expr: AssignExpression): Object | null {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);

    return value;
  }

  visitBinaryExpression(expr: BinaryExpression): Object {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    if (left === null || right === null) {
      throw Error('One of the operands is null')
    }

    switch (expr.operator.type) {
      case TokenType.Greater:
        this.checkNumberOperands(left, right)

        return left > right

      case TokenType.GreaterEqual:
        this.checkNumberOperands(left, right)

        return left >= right

      case TokenType.Less:
        this.checkNumberOperands(left, right)

        return left < right

      case TokenType.LessEqual:
        this.checkNumberOperands(left, right)

        return left <= right

      case TokenType.BangEqual:
        return !this.isEqual(left, right)

      case TokenType.EqualEqual:
        return this.isEqual(left, right)

      case TokenType.Plus:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right
        }
        if (typeof left === 'string' || typeof right === 'string') {
          return `${left}${right}`
        }

        throw new Error('Operands must be 2 numbers or at least 1 strings.')

      case TokenType.Minus:
        this.checkNumberOperands(left, right)

        return +left - +right

      case TokenType.Slash:
        this.checkNumberOperands(left, right)

        return +left / +right

      case TokenType.Star:
        this.checkNumberOperands(left, right)
        return +left * +right
    }

    // Unreachable.
    throw new Error('Unknown token type used as binary operator.')
  }

  visitGroupingExpression(expr: GroupingExpression): Object | null {
    return this.evaluate(expr.expression)
  }

  visitLiteralExpression(expr: LiteralExpression): Object {
    return expr.value
  }

  visitUnaryExpression(expr: UnaryExpression): Object {
    const right: any = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Bang:
        return !this.isTruthy(right)
      case TokenType.Minus:
        this.checkNumberOperand(right)
        return -right
    }

    // Unreachable.
    throw new Error('Unknown token type used as unary operator.')
  }

  visitVariableExpression(expr: VariableExpression): Object | null {
    return this.lookUpVariable(expr.name, expr)
  }

  private lookUpVariable(name: Token, expr: Expression): Object | null {
    return this.environment.get(name)
  }

  private checkNumberOperand(operand: Object) {
    if (typeof operand === 'number') return

    throw new Error('Operand must be a number.')
  }

  private checkNumberOperands(left: Object, right: Object) {
    if (typeof left === 'number' && typeof right === 'number') return

    throw new Error('Operands must be numbers.')
  }

  private isTruthy(object: Object) {
    if (object === null) return false
    if (typeof object === 'boolean') return object

    return true
  }

  private isEqual(a: Object, b: Object) {
    return a === b
  }

  private stringify(object: Object | null): string {
    if (object === null) return 'nil'

    return object.toString()
  }
}
