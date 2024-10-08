export enum TokenType {
  // Single character tokens
  LeftParen, // '('
  RightParen, // ')'
  LeftBrace, // '{'
  RightBrace, // '}'
  Comma, // ','
  Dot, // '.'
  Minus, // '-'
  Plus, // '+'
  Semicolon, // ';'
  Slash, // '/'
  Star, // '*'
  Percent, // %

  // One or two character tokens
  Bang, // '!'
  BangEqual, // '!='
  Equal, // '='
  EqualEqual, // '=='
  Greater, // '>'
  GreaterEqual, // '>='
  Less, // '<'
  LessEqual, // '<='

  // Literals
  Identifier,
  String,
  Number,

  // Keywords
  And,
  Class,
  Else,
  False,
  Function,
  For,
  If,
  Nil,
  Or,
  Print,
  Return,
  Super,
  This,
  True,
  Var,
  While,

  EOF,
}
