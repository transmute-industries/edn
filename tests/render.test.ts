import fs from 'fs'

import * as edn from '../src'

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString())

it(testCase.title, async () => {
    const message = Buffer.from(testCase.output.cbor, 'hex');
    const text = await edn.render(message, 'application/cbor-diagnostic')
    expect(text).toBe(fs.readFileSync(`./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.txt`).toString())
    fs.writeFileSync(`./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.txt`, text)
})
