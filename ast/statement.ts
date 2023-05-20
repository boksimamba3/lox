import { Expression } from './expression'
import { Token } from './token'

export interface StatementVisitor<T> {
  visitExpressionStatement(stmt: ExpressionStatement): T
  visitPrintStatement(stmt: PrintStatement): T
  visitVarStatement(stmt: VarStatement): T
}
export abstract class Statement {
  abstract accept<T>(visitor: StatementVisitor<T>): T
}

export class ExpressionStatement implements Statement {
  constructor(readonly expression: Expression) {}
  accept<T>(visitor: StatementVisitor<T>) {
    return visitor.visitExpressionStatement(this)
  }
}

export class PrintStatement implements Statement {
  constructor(readonly expression: Expression) {}

  accept<T>(visitor: StatementVisitor<T>) {
    return visitor.visitPrintStatement(this)
  }
}

export class VarStatement implements Statement {
  constructor(readonly name: Token, readonly initializer: Expression | null) {}

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitVarStatement(this)
  }
}
