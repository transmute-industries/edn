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