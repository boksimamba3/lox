import { Expression } from './expression'
import { Token } from './token'

export interface StatementVisitor<T> {
  visitExpressionStatement(stmt: ExpressionStatement): T
  visitPrintStatement(stmt: PrintStatement): T
  visitVariableStatement(stmt: VariableStatement): T
  visitBlockStatement(stmt: BlockStatement): T;
  visitIfStatement(stmt: IfStatement): T;
}

export abstract class Statement {
  abstract accept<T>(visitor: StatementVisitor<T>): T
}


export class BlockStatement implements Statement {
  constructor(readonly stmts: Statement[]) { }
  accept<T>(visitor: StatementVisitor<T>) {
    return visitor.visitBlockStatement(this)
  }
}

export class IfStatement implements Statement {
  constructor(
    readonly condition: Expression,
    readonly thenBranch: Statement,
    readonly elseBranch: Statement | null
  ) { }
  accept<T>(visitor: StatementVisitor<T>) {
    return visitor.visitIfStatement(this)
  }
}


export class ExpressionStatement implements Statement {
  constructor(readonly expression: Expression) { }
  accept<T>(visitor: StatementVisitor<T>) {
    return visitor.visitExpressionStatement(this)
  }
}

export class PrintStatement implements Statement {
  constructor(readonly expression: Expression) { }

  accept<T>(visitor: StatementVisitor<T>) {
    return visitor.visitPrintStatement(this)
  }
}

export class VariableStatement implements Statement {
  constructor(readonly name: Token, readonly initializer: Expression | null) { }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitVariableStatement(this)
  }
}
