import { keywords } from '../ast/keywords'
import { Token } from '../ast/token'
import { TokenType } from '../ast/token_type'
import { LoxValue } from '../interpreter/lox_object'

export class Scanner {
  private readonly tokens: Token[] = []
  private start = 0
  private current = 0
  private line = 1

  constructor(private readonly source: string) { }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current
      this.scanToken()
    }

    this.tokens.push(new Token(TokenType.EOF, '', null, this.line))

    return this.tokens
  }

  private scanToken(): void {
    const c = this.advance()

    switch (c) {
      case '(':
        this.addToken(TokenType.LeftParen)
        break
      case ')':
        this.addToken(TokenType.RightParen)
        break
      case '{':
        this.addToken(TokenType.LeftBrace)
        break
      case '}':
        this.addToken(TokenType.RightBrace)
        break
      case ',':
        this.addToken(TokenType.Comma)
        break
      case '.':
        this.addToken(TokenType.Dot)
        break
      case '-':
        this.addToken(TokenType.Minus)
        break
      case '+':
        this.addToken(TokenType.Plus)
        break
      case ';':
        this.addToken(TokenType.Semicolon)
        break
      case '*':
        this.addToken(TokenType.Star)
        break
      case '%':
        this.addToken(TokenType.Percent)
        break
      case '!':
        this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang)
        break
      case '=':
        this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal)
        break
      case '<':
        this.addToken(this.match('=') ? TokenType.LessEqual : TokenType.Less)
        break
      case '>':
        this.addToken(this.match('=') ? TokenType.GreaterEqual : TokenType.Greater)
        break
      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance()
        } else {
          this.addToken(TokenType.Slash)
        }
        break
      case ' ':
      case '\r':
      case '\t':
        // Ignore white spaces
        break
      case '\n':
        this.line++
        break
      case '"':
        this.string()
        break
      default:
        if (isDigit(c)) {
          this.number()
        } else if (isAlpha(c)) {
          this.identifier()
        } else {
          this.error(`Unexpected character: ${JSON.stringify(c)}`)
        }
    }
  }

  private string(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      this.advance()
    }

    // Unterminated string
    if (this.isAtEnd()) this.error('Unterminated string.')

    // The closing "
    this.advance()

    // Trim the surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1)
    this.addToken(TokenType.String, value)
  }

  private number(): void {
    while (isDigit(this.peek())) this.advance()

    // Look for a fractional part
    if (this.peek() === '.' && isDigit(this.peekNext())) {
      // Consume the "."
      this.advance()

      while (isDigit(this.peek())) this.advance()
    }

    const value = parseFloat(this.source.substring(this.start, this.current))

    this.addToken(TokenType.Number, value)
  }

  private identifier(): void {
    while (isAlphaNumeric(this.peek())) this.advance()
    const text = this.source.substring(this.start, this.current)
    this.addToken(keywords.get(text) || TokenType.Identifier)
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  private advance(): string {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenType, literal: LoxValue = null): void {
    const text = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false
    if (this.source.charAt(this.current) !== expected) return false

    this.advance()

    return true
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0'

    return this.source.charAt(this.current)
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0'

    return this.source.charAt(this.current + 1)
  }

  private error(message: string): never {
    throw new SyntaxError(`at line ${this.line}: ${message}`)
  }
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9'
}

function isAlpha(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
}

function isAlphaNumeric(c: string): boolean {
  return isAlpha(c) || isDigit(c)
}
