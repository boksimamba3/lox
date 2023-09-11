import { FunctionStatement } from "../ast/statement";
import { Environment } from "./environment";
import { Interpreter } from "./interpreter";
import { LoxReturn } from "./lox-return";
import { LoxCallable } from "./lox_callable";
import { LoxValue } from "./lox_object";

export class LoxFunction implements LoxCallable {
  constructor(private readonly declaration: FunctionStatement, readonly closure: Environment) { }

  arity(): number {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      const param = this.declaration.params[i];
      const argument = args[i];
      environment.define(param.lexeme, argument);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (r: unknown) {
      if (r instanceof LoxReturn) {
        return r.value;
      }
    }

    return null;
  }

}