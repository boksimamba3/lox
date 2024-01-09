import { TokenType } from './token_type'

export const keywords: Map<string, TokenType> = new Map([
  ['and', TokenType.And],
  ['class', TokenType.Class],
  ['else', TokenType.Else],
  ['false', TokenType.False],
  ['for', TokenType.For],
  ['function', TokenType.Function],
  ['if', TokenType.If],
  ['nil', TokenType.Nil],
  ['or', TokenType.Or],
  ['print', TokenType.Print],
  ['return', TokenType.Return],
  ['super', TokenType.Super],
  ['this', TokenType.This],
  ['true', TokenType.True],
  ['var', TokenType.Var],
  ['while', TokenType.While],
])
