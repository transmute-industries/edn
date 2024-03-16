const fs = require('fs')

const testCase = JSON.parse(fs.readFileSync('./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.json').toString());

(async () => {
  const data = Buffer.from(testCase.output.cbor, 'hex')
  fs.writeFileSync(`./src/__fixtures__/ecdsa-examples/ecdsa-sig-02.cbor`, data)
})()