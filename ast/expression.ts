import { Token } from './token'

export interface ExpressionVisitor<T> {
  visitAssignExpression(expr: AssignExpression): T
  visitBinaryExpression(expr: BinaryExpression): T
  visitGroupingExpression(expr: GroupingExpression): T
  visitLiteralExpression(expr: LiteralExpression): T
  visitUnaryExpression(expr: UnaryExpression): T
  visitVariableExpression(expr: VariableExpression): T
  visitLogicalExpression(expr: LogicalExpression): T
}

export abstract class Expression {
  abstract accept<T>(visitor: ExpressionVisitor<T>): T
}

export class AssignExpression implements Expression {
  constructor(
    readonly name: Token,
    readonly value: Expression,
  ) { }

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitAssignExpression(this)
  }
}

export class BinaryExpression implements Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitBinaryExpression(this)
  }
}

export class LogicalExpression implements Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitLogicalExpression(this)
  }
}

export class GroupingExpression implements Expression {
  constructor(readonly expression: Expression) { }

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitGroupingExpression(this)
  }
}

export class LiteralExpression implements Expression {
  constructor(value: any) {
    this.value = value
  }

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitLiteralExpression(this)
  }

  readonly value: any
}

export class UnaryExpression implements Expression {
  constructor(readonly operator: Token, readonly right: Expression) { }
  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitUnaryExpression(this)
  }
}

export class VariableExpression implements Expression {
  constructor(readonly name: Token) { }

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitVariableExpression(this)
  }
}
