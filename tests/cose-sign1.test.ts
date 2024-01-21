import fs from 'fs'

import * as edn from '../src'

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString())

it(testCase.title, async () => {
  const { cbor_diag } = testCase.output
  const graph = await edn.parse(cbor_diag) as edn.EDNSeq
  expect(graph.get(0).value.toString('hex')).toBe('a1013822')
})
