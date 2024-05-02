import { Interpreter } from "./interpreter";
import { LoxCallable } from "./lox_callable";
import { LoxFunction } from "./lox_function";
import { LoxInstance } from "./lox_instance";
import { LoxValue } from "./lox_object";

export class LoxClass implements LoxCallable {
  constructor(
    public readonly name: string,
    private readonly superClass: LoxClass | null,
    private readonly methods: Map<string, LoxFunction>
  ) {}

  arity(): number {
    const initializer = this.findMethod("init");
    if (initializer !== null) return initializer.arity();

    return 0;
  }

  call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");

    if (initializer !== null) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  findMethod(name: string): LoxFunction | null {
    if (this.methods.has(name)) {
      return this.methods.get(name)!;
    }

    if (this.superClass !== null) {
      return this.superClass.findMethod(name);
    }

    return null;
  }

  toString() {
    return this.name;
  }
}
