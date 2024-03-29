import fs from 'fs'

import * as edn from '../src'

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString())

it(testCase.title, async () => {
  const graph1 = await edn.parse(testCase.output.cbor_diag) as edn.EDNCoseSign1
  expect(graph1.seq.get(0).value.toString('hex')).toBe('a1013822')
  const graph2 = await edn.parse(Buffer.from(testCase.output.cbor, 'hex')) as edn.EDNCoseSign1
  expect(graph2.seq.get(0).value.toString('hex')).toBe('a1013822')
})
