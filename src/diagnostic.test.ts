

import { encode} from 'cbor'
import * as edn from '.'

// https://datatracker.ietf.org/doc/draft-ietf-cbor-edn-literals/

it('simple object', async ()=>{
  const encoded = encode({ hello: ['string', 0, false], hello2: Buffer.from('facade', 'hex')})
  const diag = await edn.diagnose(encoded)
  expect(diag).toBe(`{"hello": ["string", 0, false], "hello2": h'facade'}
`);
  // const parsed = edn.parse(diag)
  // console.log(parsed)
})

it('simple array', async ()=>{
  const encoded = encode(['string', 0, false, ['deep', ['nested']]])
  const diag = await edn.diagnose(encoded)
  expect(diag).toBe(`["string", 0, false, ["deep", ["nested"]]]
`);
  const parsed = edn.parse(diag) as any
  // console.log(parsed)
  // console.log(diag)

  console.log(parsed[3])
})


