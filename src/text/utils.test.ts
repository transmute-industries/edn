import { unwrap, EDNMap, EDNSeq } from './utils'



it('unwrap map', () => {
  const diag = `{"hello": ["string", 0, false], "hello2": h'facade'}`
  const graph = unwrap(diag) as EDNMap;
  const [key, entry] = graph.get("hello2")
  expect(key.label).toBe('hello2')
  expect(entry.value.toString('hex')).toBe('facade')
})

it('unwrap seq', () => {
  const diag = `["string", 0, false, ["deep", ["nested"]]]`
  const graph = unwrap(diag) as EDNSeq;
  expect(graph.get(0).value).toBe('string')
  expect(graph.get(1).value).toBe(0)
  expect(graph.get(2).value).toBe(false)
  const entry2 = graph.get(3)
  expect(entry2.entries[0].value).toBe('deep')
})

// it('handle wg repo examples', async ()=>{
//   const data = Buffer.from('D28443A10126A10442313154546869732069732074686520636F6E74656E742E584010729CD711CB3813D8D8E944A8DA7111E7B258C9BDCA6135F7AE1ADBEE9509891267837E1E33BD36C150326AE62755C6BD8E540C3E8F92D7D225E8DB72B8820B', 'hex')
//   const diag = await edn.diagnose(data);
//   const parsed = edn.parse<edn.MapLike>(diag)
//   console.log(parsed)
// })