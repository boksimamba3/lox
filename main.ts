import { readFile } from 'fs/promises'
import { Scanner } from './scanner/scanner'

const filename = process.argv[2]

if (!filename) {
  throw Error('Missing file name. Please provide file name you wish to execute.')
}

try {
  const source = await readFile(filename, 'utf8')
  const scanner = new Scanner(source)
  const tokens = scanner.scanTokens()
  for (let token of tokens) {
    console.log(token.toString())
  }
} catch (err) {
  console.error('Error opening file.')
}
