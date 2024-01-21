import { unwrap, EDNMap } from './utils'

it('unwrap sequence', () => {
  const diag = `{"hello": ["string", 0, false], "hello2": h'facade'}`
  const graph = unwrap(diag) as EDNMap;
  const [key, entry] = graph.get("hello2")
  expect(key.label).toBe('hello2')
  expect(entry.value.toString('hex')).toBe('facade')
})