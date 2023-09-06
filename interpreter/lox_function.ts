import { FunctionStatement } from "../ast/statement";
import { Environment } from "./environment";
import { Interpreter } from "./interpreter";
import { LoxCallable } from "./lox_callable";
import { LoxValue } from "./lox_object";

export class LoxFunction implements LoxCallable {
  constructor(private readonly declaration: FunctionStatement) { }

  arity(): number {
    return this.declaration.params.length;
  }
  call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
    const environment = new Environment(interpreter.globals);
    for (let i = 0; i < this.declaration.params.length; i++) {
      const param = this.declaration.params[i];
      const argument = args[i];
      environment.define(param.lexeme, argument);
    }

    interpreter.executeBlock(this.declaration.body, environment);

    return null;
  }

}