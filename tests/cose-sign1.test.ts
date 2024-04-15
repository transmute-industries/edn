import fs from 'fs'

import * as edn from '../src'

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString())

it(testCase.title, async () => {
  const graph1 = await edn.parse(testCase.output.cbor_diag) as edn.EDNCoseSign1
  expect(graph1.seq.get(0).value.toString('hex')).toBe('a1013822')
  const graph2 = await edn.parse(Buffer.from(testCase.output.cbor, 'hex')) as edn.EDNCoseSign1
  expect(graph2.seq.get(0).value.toString('hex')).toBe('a1013822')

  const text = await edn.render(Buffer.from(testCase.output.cbor, 'hex'), 'application/cbor-diagnostic')
  expect(text).toBe(`
/ cose-sign1 / 18([
  / protected / << {
    / alg / 1 : -35 / ES384 /
  } >>,
  / unprotected / {
    / kid / 4 : h'50333834'
  },
  / payload / h'54686973...656e742e',
  / signature / h'5f150abd...59622a3c'
])
  `.trim())
 
})
