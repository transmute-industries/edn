import * as cbor from 'cbor'

it('can produce compact diagnostic', async ()=>{
  const encoded = cbor.encode({ hello: ['string', 0, false]})
  const diag = await cbor.diagnose(encoded)
  expect(diag).toBe(`{"hello": ["string", 0, false]}
`);
})