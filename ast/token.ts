import { LoxValue } from '../interpreter/lox_object'
import { TokenType } from './token_type'

export class Token {
  constructor(
    readonly type: TokenType,
    readonly lexeme: string,
    readonly literal: LoxValue,
    readonly line: number
  ) {
    this.type = type
    this.lexeme = lexeme
    this.literal = literal
    this.line = line
  }

  toString(): string {
    return `${TokenType[this.type]} - ${this.lexeme} - ${this.literal}`
  }
}
