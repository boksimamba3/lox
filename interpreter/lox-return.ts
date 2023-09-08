import { LoxValue } from "./lox_object";

export class LoxReturn extends Error {
  constructor(readonly value: LoxValue) {
    super("Return value")
  }
}