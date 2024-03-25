import { Token } from "../ast/token";
import { LoxClass } from "./lox_class";

export class LoxInstance {
  private readonly fields = new Map();

  constructor(private cls: LoxClass) {}

  get(name: Token) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    const method = this.cls.findMethod(name.lexeme);

    if (method !== null) return method;

    throw new Error(`Undefined property '${name.lexeme}'.`);
  }

  set(name: Token, value: Object | null) {
    this.fields.set(name.lexeme, value);
  }

  toString() {
    return this.cls.name + " instance";
  }
}
