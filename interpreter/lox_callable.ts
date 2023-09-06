import { Interpreter } from "./interpreter";
import { LoxValue } from "./lox_object";

export interface LoxCallable {
  arity(): number;
  call(interpreter: Interpreter, args: LoxValue[]): LoxValue;
}