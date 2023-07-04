import { Token } from '../ast/token'
import { TokenType } from '../ast/token_type'
import {
  AssignExpression,
  BinaryExpression,
  Expression,
  GroupingExpression,
  LiteralExpression,
  UnaryExpression,
  VariableExpression,
} from '../ast/expression'
import {
  ExpressionStatement,
  PrintStatement,
  Statement,
  VariableStatement,
} from '../ast/statement'

export class Parser {
  private current = 0
  private errors: SyntaxError[] = []

  constructor(private readonly tokens: Token[]) { }

  parse(): [statements: Statement[], errors: SyntaxError[]] {
    this.errors = []
    const statements: Statement[] = []

    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration())
      } catch (err) {
        console.log(err)
        this.synchronize()
      }
    }

    return [statements, this.errors]
  }

  private declaration(): Statement {
    if (this.match(TokenType.Var)) {
      return this.varDeclaration()
    }

    return this.statement()
  }

  private varDeclaration(): Statement {
    const name = this.consume(TokenType.Identifier, 'Expect variable name.')

    let initializer = null
    if (this.match(TokenType.Equal)) {
      initializer = this.expression()
    }

    this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.")

    return new VariableStatement(name, initializer)
  }

  private statement(): Statement {
    if (this.match(TokenType.Print)) {
      return this.printStatement()
    }

    return this.expressionStatement()
  }

  private printStatement(): Statement {
    const value = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after value.")

    return new PrintStatement(value)
  }

  private expressionStatement(): Statement {
    const value = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after expression.")

    return new ExpressionStatement(value)
  }

  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expr = this.equality();

    if (this.match(TokenType.Equal)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof VariableExpression) {
        const name = expr.name;

        return new AssignExpression(name, value);
      }

      this.error(`${equals} Invalid assignment target`,)
    }

    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison()

    while (this.match(TokenType.BangEqual, TokenType.EqualEqual)) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new BinaryExpression(expr, operator, right)
    }

    return expr
  }

  private comparison(): Expression {
    let expr = this.term()

    while (
      this.match(
        TokenType.Greater,
        TokenType.GreaterEqual,
        TokenType.Less,
        TokenType.LessEqual
      )
    ) {
      const operator = this.previous()
      const right = this.term()
      expr = new BinaryExpression(expr, operator, right)
    }

    return expr
  }

  private term(): Expression {
    let expr = this.factor()

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator = this.previous()
      const right = this.factor()
      expr = new BinaryExpression(expr, operator, right)
    }

    return expr
  }

  private factor(): Expression {
    let expr = this.unary()

    while (this.match(TokenType.Slash, TokenType.Star)) {
      const operator = this.previous()
      const right = this.unary()
      expr = new BinaryExpression(expr, operator, right)
    }

    return expr
  }

  private unary(): Expression {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous()
      const right = this.unary()

      return new UnaryExpression(operator, right)
    }

    return this.primary()
  }

  private primary(): Expression {
    if (this.match(TokenType.False)) return new LiteralExpression(false)
    if (this.match(TokenType.True)) return new LiteralExpression(true)
    if (this.match(TokenType.Nil)) return new LiteralExpression(null)
    if (this.match(TokenType.Number, TokenType.String))
      return new LiteralExpression(this.previous().literal)

    if (this.match(TokenType.Identifier))
      return new VariableExpression(this.previous())

    if (this.match(TokenType.LeftParen)) {
      const expr = this.expression()
      this.consume(TokenType.RightParen, "Expect ')' after expression.")

      return new GroupingExpression(expr)
    }

    throw this.error('Expected expression.')
  }

  private synchronize(): void {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.Semicolon) return

      switch (this.peek().type) {
        case TokenType.Class:
        case TokenType.Fun:
        case TokenType.Var:
        case TokenType.For:
        case TokenType.If:
        case TokenType.While:
        case TokenType.Print:
        case TokenType.Return:
          return
      }

      this.advance()
    }
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()

    throw this.error(message)
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }

    return false
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false

    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current += 1

    return this.previous()
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private previous(): Token {
    return this.tokens[this.current - 1]
  }

  private error(message: string): SyntaxError {
    const error = new SyntaxError(message)
    this.errors.push(error)

    return error
  }
}
