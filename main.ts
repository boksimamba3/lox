import { readFile } from 'fs/promises'

const filename = process.argv[2]

if (!filename) {
  throw Error('Missing file name. Please provide file name you wish to execute.')
}

try {
  const content = await readFile(filename, 'utf8')
  console.log(content)
} catch (err) {
  console.error('Error opening file.')
}
