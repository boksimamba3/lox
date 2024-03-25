export class LoxClass {
  constructor(public readonly name: string) {}

  toString() {
    return this.name;
  }
}
