# @transmute/edn

[![CI](https://github.com/transmute-industries/edn/actions/workflows/ci.yml/badge.svg)](https://github.com/transmute-industries/edn/actions/workflows/ci.yml)
![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

<!-- [![NPM](https://nodei.co/npm/@transmute/edn.png?mini=true)](https://npmjs.org/package/@transmute/edn) -->

🚧 Experimental 🔥

This package generates HTML in a naive manner that could lead to XSS.

<img src="./transmute-banner.png" />


#### [Questions? Contact Transmute](https://transmute.typeform.com/to/RshfIw?typeform-source=edn)

## Usage

```bash
npm i @transmute/edn --save
```

```ts
import * as edn from "@transmute/edn";
const document: edn.EDNCoseSign1 = await edn.parse(
  Buffer.from("D28444A1013822A1044...02E9D91E9B7B59622A3C", "hex")
  // or "18([h'A1013822', {4: h'5 ...
)
const message = Buffer.from("D28444A1013822A1044...02E9D91E9B7B59622A3C", "hex");
const html = await edn.render(message, 'text/html')
```

## Develop

```bash
npm i
npm t
npm run lint
npm run build
```
