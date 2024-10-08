import { Token } from "./token";

export interface ExpressionVisitor<T> {
  visitAssignExpression(expr: AssignExpression): T;
  visitBinaryExpression(expr: BinaryExpression): T;
  visitGroupingExpression(expr: GroupingExpression): T;
  visitLiteralExpression(expr: LiteralExpression): T;
  visitUnaryExpression(expr: UnaryExpression): T;
  visitVariableExpression(expr: VariableExpression): T;
  visitLogicalExpression(expr: LogicalExpression): T;
  visitCallExpression(expr: CallExpression): T;
  visitGetExpression(expr: GetExpression): T;
  visitSetExpression(expr: GetExpression): T;
  visitThisExpression(expr: ThisExpression): T;
  visitSuperExpression(expr: SuperExpression): T;
}

export abstract class Expression {
  abstract accept<T>(visitor: ExpressionVisitor<T>): T;
}

export class AssignExpression implements Expression {
  constructor(readonly name: Token, readonly value: Expression) {}

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitAssignExpression(this);
  }
}

export class CallExpression implements Expression {
  constructor(
    readonly callee: Expression,
    readonly paren: Token,
    readonly args: Expression[]
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitCallExpression(this);
  }
}

export class BinaryExpression implements Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitBinaryExpression(this);
  }
}

export class LogicalExpression implements Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitLogicalExpression(this);
  }
}

export class GroupingExpression implements Expression {
  constructor(readonly expression: Expression) {}

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitGroupingExpression(this);
  }
}

export class LiteralExpression implements Expression {
  constructor(readonly value: any) {}

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitLiteralExpression(this);
  }
}

export class UnaryExpression implements Expression {
  constructor(readonly operator: Token, readonly right: Expression) {}
  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitUnaryExpression(this);
  }
}

export class VariableExpression implements Expression {
  constructor(readonly name: Token) {}

  accept<T>(visitor: ExpressionVisitor<T>) {
    return visitor.visitVariableExpression(this);
  }
}

export class GetExpression implements Expression {
  constructor(readonly object: Expression, readonly name: Token) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitGetExpression(this);
  }
}

export class SetExpression implements Expression {
  constructor(
    readonly object: Expression,
    readonly name: Token,
    readonly value: Expression
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitSetExpression(this);
  }
}

export class ThisExpression implements Expression {
  constructor(readonly keyword: Token) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitThisExpression(this);
  }
}

export class SuperExpression implements Expression {
  constructor(readonly keyword: Token, readonly method: Token) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitSuperExpression(this);
  }
}
