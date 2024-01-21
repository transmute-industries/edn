import fs from 'fs'

import * as edn from '../src'

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString())

it(testCase.title, async () => {
  const graph1 = await edn.parse(testCase.output.cbor_diag) as edn.EDNCoseSign1
  const alg = graph1.signatureAlgorithm()
  expect(alg.value).toBe(-35)
  expect(alg.comment).toBe('ECDSA with SHA-384')
})
