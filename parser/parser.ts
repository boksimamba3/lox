import { Token } from "../ast/token";
import { TokenType } from "../ast/token_type";
import {
  AssignExpression,
  BinaryExpression,
  CallExpression,
  Expression,
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
  VariableStatement,
  WhileStatement,
} from "../ast/statement";

/**
Parser grammar:
  program      => declaration* EOF
  declaration  => classDecl | funcDecl | varDecl | typeDecl | statement
  classDecl    => "class" IDENTIFIER ( "<" IDENTIFIER )? "{" ( method | field )* "}"
  method       => IDENTIFIER parameterList? ( ":" type )? block
  field        => IDENTIFIER "=" expression ";"
  funDecl      => "fun" function
  function     => IDENTIFIER parameterList ( ":" type )? block
  parameters   => IDENTIFIER ( ":" type )? ( "," IDENTIFIER ( ":" type )? )*
  varDecl      => "var" IDENTIFIER ( ":" type )? ( "=" expression )? ";"
  type         => ( "[" type ( "," type )* "]"
                  | IDENTIFIER ( "<" type ( "," type )* ">" )? )
                  ( "|" type )*
  typeDecl     => "type" IDENTIFIER "=" type ";"
  statement    => exprStmt | ifStmt | forStmt | printStmt | returnStmt | whileStmt
                  | breakStmt | continueStmt | block
  exprStmt     => expression ";"
  ifStmt       => "if" "(" expression ")" statement ( "else" statement )?
  forStmt      => "for" "(" ( varDecl | exprStmt | ";" ) expression? ";" expression? ")" statement
  printStmt    => "print" expression ";"
  returnStmt   => "return" expression? ";"
  whileStmt    => "while" "(" expression ")" statement
  block        => "{" declaration* "}" ;
  expression   => series
  series       => assignment ( "," assignment )*
  assignment   => ( call "." )? IDENTIFIER "=" assignment | ternary
  ternary      => logic_or ( "?" ternary ":" ternary )*
  logic_or     => logic_and ( "or" logic_and )*
  logic_and    => equality ( "and" equality )*
  equality     => comparison ( ( "!=" | "==" ) comparison )
  comparison   => term ( ( ">" | ">=" | "<" | "<=" ) term )*
  term         => factor ( ( "+" | "-" ) factor )*
  factor       => unary ( ( "/" | "*" ) unary )*
  unary        => ( "!" | "-" ) unary | call
  call         => primary ( "(" arguments? ")" | "." IDENTIFIER )*
  arguments    => expression ( "," expression )*
  primary      => NUMBER | STRING | "true" | "false" | "nil" | "(" expression ")"
                  | IDENTIFIER | functionExpr | "super" . IDENTIFIER
  functionExpr => "fun" IDENTIFIER? parameterList ( ":" type )? block
  Reference: C Operator Precedence https://en.cppreference.com/w/c/language/operator_precedence
*/

export class Parser {
  private current = 0;
  private errors: SyntaxError[] = [];

  constructor(private readonly tokens: Token[]) {}

  parse(): [statements: Statement[], errors: SyntaxError[]] {
    this.errors = [];
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration());
      } catch (err) {
        console.log(err);
        this.synchronize();
      }
    }

    return [statements, this.errors];
  }

  private declaration(): Statement {
    if (this.match(TokenType.Class)) {
      return this.classDeclaration();
    }
    if (this.match(TokenType.Function)) {
      return this.functionDeclaration("function");
    }
    if (this.match(TokenType.Var)) {
      return this.varDeclaration();
    }

    return this.statement();
  }

  private classDeclaration(): Statement {
    const name = this.consume(TokenType.Identifier, "Expect class name.");
    this.consume(TokenType.LeftBrace, "Expect '{' before class body.");

    const methods: FunctionStatement[] = [];

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      methods.push(this.functionDeclaration("method"));
    }

    this.consume(TokenType.RightBrace, "Expect '}' after class");

    return new ClassStatement(name, methods);
  }

  private functionDeclaration(kind: string): FunctionStatement {
    const name = this.consume(TokenType.Identifier, `Expect ${kind} name.`);
    this.consume(TokenType.LeftParen, `Expect '(' after ${kind} name.`);
    const params: Token[] = [];
    if (!this.check(TokenType.RightParen)) {
      do {
        if (params.length >= 255) {
          this.error("Can't have more than 255 parameters");
        }
        params.push(
          this.consume(TokenType.Identifier, "Expect parameter name.")
        );
      } while (this.match(TokenType.Comma));
    }

    this.consume(TokenType.RightParen, "Expect ')' after parameters.");
    this.consume(TokenType.LeftBrace, `Expect '{' before ${kind} body.`);
    const body = this.block();

    return new FunctionStatement(name, params, body);
  }

  private varDeclaration(): Statement {
    const name = this.consume(TokenType.Identifier, "Expect variable name.");

    let initializer = null;
    if (this.match(TokenType.Equal)) {
      initializer = this.expression();
    }

    this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.");

    return new VariableStatement(name, initializer);
  }

  private statement(): Statement {
    if (this.match(TokenType.For)) {
      return this.forStatement();
    }
    if (this.match(TokenType.If)) {
      return this.ifStatement();
    }
    if (this.match(TokenType.Print)) {
      return this.printStatement();
    }
    if (this.match(TokenType.Return)) {
      return this.returnStatement();
    }
    if (this.match(TokenType.While)) {
      return this.whileStatement();
    }
    if (this.match(TokenType.LeftBrace)) {
      return new BlockStatement(this.block());
    }

    return this.expressionStatement();
  }

  private returnStatement(): Statement {
    const keyword = this.previous();
    let value: Expression | null = null;
    if (!this.check(TokenType.Semicolon)) {
      value = this.expression();
    }

    this.consume(TokenType.Semicolon, "Expect ';' after return value");

    return new ReturnStatement(keyword, value);
  }

  private forStatement(): Statement {
    this.consume(TokenType.LeftParen, "Expect '(' after 'for'.");
    let initializer;
    if (this.match(TokenType.Semicolon)) {
      initializer = null;
    } else if (this.match(TokenType.Var)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition = null;
    if (!this.check(TokenType.Semicolon)) {
      condition = this.expression();
    }
    this.consume(TokenType.Semicolon, "Expect ';' after loop condition.");

    let increment = null;
    if (!this.check(TokenType.RightParen)) {
      increment = this.expression();
    }
    this.consume(TokenType.RightParen, "Expect ')' after for clauses.");

    let stmt = this.statement();

    if (increment !== null) {
      stmt = new BlockStatement([stmt, new ExpressionStatement(increment)]);
    }

    if (condition == null) {
      condition = new LiteralExpression(true);
    }
    stmt = new WhileStatement(condition, stmt);

    if (initializer !== null) {
      stmt = new BlockStatement([initializer, stmt]);
    }

    return stmt;
  }

  private ifStatement(): Statement {
    this.consume(TokenType.LeftParen, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RightParen, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.Else)) {
      elseBranch = this.statement();
    }

    return new IfStatement(condition, thenBranch, elseBranch);
  }

  private printStatement(): Statement {
    const value = this.expression();
    this.consume(TokenType.Semicolon, "Expect ';' after value.");

    return new PrintStatement(value);
  }

  private whileStatement(): Statement {
    this.consume(TokenType.LeftParen, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RightParen, "Expect ')' after while condition.");

    const stmt = this.statement();

    return new WhileStatement(condition, stmt);
  }

  private expressionStatement(): Statement {
    const value = this.expression();
    this.consume(TokenType.Semicolon, "Expect ';' after expression.");

    return new ExpressionStatement(value);
  }

  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expr = this.or();

    if (this.match(TokenType.Equal)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof VariableExpression) {
        const name = expr.name;

        return new AssignExpression(name, value);
      }

      this.error(`${equals} Invalid assignment target`);
    }

    return expr;
  }

  private or(): Expression {
    let expr = this.and();

    while (this.match(TokenType.Or)) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpression(expr, operator, right);
    }

    return expr;
  }

  private and(): Expression {
    let expr = this.equality();

    while (this.match(TokenType.And)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new LogicalExpression(expr, operator, right);
    }

    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();

    while (this.match(TokenType.BangEqual, TokenType.EqualEqual)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();

    while (
      this.match(
        TokenType.Greater,
        TokenType.GreaterEqual,
        TokenType.Less,
        TokenType.LessEqual
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private term(): Expression {
    let expr = this.factor();

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();

    while (this.match(TokenType.Slash, TokenType.Star, TokenType.Percent)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.unary();

      return new UnaryExpression(operator, right);
    }

    return this.call();
  }

  private call(): Expression {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LeftParen)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expression): Expression {
    const args: Expression[] = [];

    if (!this.check(TokenType.RightParen)) {
      do {
        if (args.length >= 255) {
          this.error("Can't have more than 255 arguments");
        }
        args.push(this.expression());
      } while (this.match(TokenType.Comma));
    }

    const paren = this.consume(
      TokenType.RightParen,
      "Expect ')' after arguments."
    );

    return new CallExpression(callee, paren, args);
  }

  private primary(): Expression {
    if (this.match(TokenType.False)) return new LiteralExpression(false);
    if (this.match(TokenType.True)) return new LiteralExpression(true);
    if (this.match(TokenType.Nil)) return new LiteralExpression(null);
    if (this.match(TokenType.Number, TokenType.String))
      return new LiteralExpression(this.previous().literal);

    if (this.match(TokenType.Identifier))
      return new VariableExpression(this.previous());

    if (this.match(TokenType.LeftParen)) {
      const expr = this.expression();
      this.consume(TokenType.RightParen, "Expect ')' after expression.");

      return new GroupingExpression(expr);
    }

    throw this.error("Expected expression.");
  }

  private block(): Statement[] {
    const stmts: Statement[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      stmts.push(this.declaration());
    }

    this.consume(TokenType.RightBrace, `Expect '}' after block.`);

    return stmts;
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.Semicolon) return;

      switch (this.peek().type) {
        case TokenType.Class:
        case TokenType.Function:
        case TokenType.Var:
        case TokenType.For:
        case TokenType.If:
        case TokenType.While:
        case TokenType.Print:
        case TokenType.Return:
          return;
      }

      this.advance();
    }
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(message);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;

    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current += 1;

    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(message: string): SyntaxError {
    const error = new SyntaxError(message);
    this.errors.push(error);

    return error;
  }
}
