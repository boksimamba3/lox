import { Interpreter } from "./interpreter";
import { LoxCallable } from "./lox_callable";
import { LoxInstance } from "./lox_instance";
import { LoxValue } from "./lox_object";

export class LoxClass implements LoxCallable {
  constructor(public readonly name: string) {}

  arity(): number {
    return 0;
  }

  call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
    const instance = new LoxInstance(this);

    return instance;
  }

  toString() {
    return this.name;
  }
}
