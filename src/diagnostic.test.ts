

import { encode} from 'cbor'
import * as edn from '.'

// https://datatracker.ietf.org/doc/draft-ietf-cbor-edn-literals/

it('simple object', async ()=>{
  const encoded = encode({ hello: ['string', 0, false], hello2: Buffer.from('facade', 'hex')})
  const diag = await edn.diagnose(encoded)
  expect(diag).toBe(`{"hello": ["string", 0, false], "hello2": h'facade'}
`);
  const map = edn.parse<edn.EDNMap>(diag)
  const labeledData = map.getLabel('hello')
  console.log(labeledData)
  // const item = edn.getMapKeyFromLabel(parsed, 'hello')
  // expect(item[0].get('label')).toBe('string')
  // expect(item[1].get('label')).toBe(0)
})

// it('nested arrays', async ()=>{
//   const encoded = encode(['string', 0, false, ['deep', ['nested']]])
//   const diag = await edn.diagnose(encoded)
//   expect(diag).toBe(`["string", 0, false, ["deep", ["nested"]]]
// `);
//   const parsed = edn.parse<edn.Sequence>(diag)
//   expect(parsed[3][0].get('label')).toBe('deep')
//   expect(parsed[3][1][0].get('label')).toBe('nested')
// })

// it('handle wg repo examples', async ()=>{
//   const data = Buffer.from('D28443A10126A10442313154546869732069732074686520636F6E74656E742E584010729CD711CB3813D8D8E944A8DA7111E7B258C9BDCA6135F7AE1ADBEE9509891267837E1E33BD36C150326AE62755C6BD8E540C3E8F92D7D225E8DB72B8820B', 'hex')
//   const diag = await edn.diagnose(data);
//   const parsed = edn.parse<edn.MapLike>(diag)
//   console.log(parsed)
// })