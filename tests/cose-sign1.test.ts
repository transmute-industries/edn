import fs from 'fs'

import * as edn from '../src'

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString())

it(testCase.title, () => {
  const { cbor_diag } = testCase.output
  const graph = edn.unwrap(cbor_diag)
  console.log(graph)
})
