import { Interpreter } from "./interpreter";
import { LoxCallable } from "./lox_callable";
import { LoxFunction } from "./lox_function";
import { LoxInstance } from "./lox_instance";
import { LoxValue } from "./lox_object";

export class LoxClass implements LoxCallable {
  constructor(
    public readonly name: string,
    private readonly methods: Map<string, LoxFunction>
  ) {}

  arity(): number {
    return 0;
  }

  call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
    const instance = new LoxInstance(this);

    return instance;
  }

  findMethod(name: string): LoxFunction | null {
    return this.methods.get(name) ?? null;
  }

  toString() {
    return this.name;
  }
}
