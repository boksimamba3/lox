import { Token } from './token'

export interface ExpressionVisitor<T> {
  visitBinaryExpression(expr: BinaryExpression): T
  visitGroupingExpression(expr: GroupingExpression): T
  visitLiteralExpression(expr: LiteralExpression): T
  visitUnaryExpression(expr: UnaryExpression): T
  visitVariableExpression(expr: VariableExpression): T
}

export abstract class Expression {
  abstract accept<T>(visitor: ExpressionVisitor<T>): T
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

export class GroupingExpression implements Expression {
  constructor(readonly expression: Expression) {}

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
  constructor(readonly operator: Token, readonly right: Expression) {}
  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitUnaryExpression(this)
  }
}

export class VariableExpression implements Expression {
  constructor(readonly name: Token) {}

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitVariableExpression(this)
  }
}
