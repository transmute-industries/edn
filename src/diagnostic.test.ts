

import { encode} from 'cbor'
import * as edn from '.'

// https://datatracker.ietf.org/doc/draft-ietf-cbor-edn-literals/

it('simple object', async ()=>{
  const encoded = encode({ hello: ['string', 0, false], hello2: Buffer.from('facade', 'hex')})
  const diag = await edn.diagnose(encoded)
  expect(diag).toBe(`{"hello": ["string", 0, false], "hello2": h'facade'}
`);
  const parsed = edn.parse<edn.MapLike>(diag)
  const item = edn.getMapKeyFromLabel(parsed, 'hello')
  expect(item[0].get('label')).toBe('string')
  expect(item[1].get('label')).toBe(0)
})

it('nested arrays', async ()=>{
  const encoded = encode(['string', 0, false, ['deep', ['nested']]])
  const diag = await edn.diagnose(encoded)
  expect(diag).toBe(`["string", 0, false, ["deep", ["nested"]]]
`);
  const parsed = edn.parse<edn.Sequence>(diag)
  expect(parsed[3][0].get('label')).toBe('deep')
  expect(parsed[3][1][0].get('label')).toBe('nested')
})


