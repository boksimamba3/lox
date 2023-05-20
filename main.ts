import { readFile } from 'fs/promises'
import { Scanner } from './scanner/scanner'
import { Parser } from './parser/parser'
import { Interpreter } from './interpreter/interpreter'

const filename = process.argv[2]

if (!filename) {
  throw Error('Missing file name. Please provide file name you wish to execute.')
}

try {
  const source = await readFile(filename, 'utf8')
  const scanner = new Scanner(source)
  const tokens = scanner.scanTokens()
  const parser = new Parser(tokens)
  const [statements] = parser.parse()
  const interpreter = new Interpreter()
  interpreter.interpret(statements)
} catch (err) {
  console.error(err)
  process.exit(1)
}
