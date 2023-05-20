import { Token } from '../ast/token'

export class Environment {
  readonly enclosing: Environment | null
  private values = new Map<string, Object | null>()

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing
  }

  define(name: string, value: Object | null): void {
    this.values.set(name, value)
  }

  assign(name: Token, value: Object): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value)

      return
    }

    throw new Error('Undefined variable.')
  }

  get(name: Token): Object | null {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme) ?? null
    }

    throw new Error('Undefined variable.')
  }
}
