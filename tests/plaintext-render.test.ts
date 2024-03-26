import fs from 'fs'

import * as edn from '../src'

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString())

it(testCase.title, async () => {
    const message = Buffer.from(testCase.output.cbor, 'hex');
    const html = await edn.render(message, 'text/plain')
    fs.writeFileSync(`./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.txt`, html)
})
