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

  assign(name: Token, value: Object | null): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value)

      return
    }

    if (this.enclosing !== null) {
      return this.enclosing.assign(name, value);
    }

    throw new Error(`Undefined variable ${name.lexeme}.`)
  }

  assignAt(distance: number, name: Token, value: Object | null): void {
    this.ancestor(distance)?.values.set(name.lexeme, value);
  }

  get(name: Token): Object | null {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme) ?? null
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new Error(`Undefined variable ${name.lexeme}.`)
  }

  getAt(distance: number, name: string): Object | null {
    return this.ancestor(distance)?.values.get(name) ?? null
  }

  ancestor(distance: number): Environment | null {
    let environment: Environment | null = this;
    for (let i = 0; i < distance; i++) {
      environment = environment?.enclosing ?? null;
    }

    return environment;
  }

}
