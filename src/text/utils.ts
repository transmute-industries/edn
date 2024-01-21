




import { diagnose } from "cbor"

import * as coseAlgs from '../cose/alg'

const isMap = (content: string) => content.startsWith('{') && content.endsWith('}')

const isSeq = (content: string) => content.startsWith('[') && content.endsWith(']')

const isBytes = (content: string) => content.startsWith(`h'`) && content.endsWith(`'`)
const isTextString = (content: string) => content.startsWith(`"`) && content.endsWith(`"`)

const isNumber = (content: string) => {
  return `${parseInt(content, 10)}` === content
}

const isBoolean = (content: string) => {
  return ['true', 'false'].includes(content)
}

const getTag = (content: string) => {
  const indexOfFirstParen = content.indexOf('(')
  if (indexOfFirstParen === -1) {
    return undefined
  }
  return content.slice(0, indexOfFirstParen)
}

const removeTag = (content: string) => {
  const indexOfFirstParen = content.indexOf('(')
  if (indexOfFirstParen === -1) {
    return content
  }
  return content.slice(indexOfFirstParen + 1, content.length - 1)
}

const getSymbolBefore = (content: string, symbol: string) => {
  let indexOfSymbol = content.indexOf(symbol);
  if (indexOfSymbol === -1) {
    indexOfSymbol = content.length
  }
  return content.slice(0, indexOfSymbol).trim()
}

const selectBoundedText = (content: string, start: string, end: string) => {
  let depth = 0;
  let text = ''
  for (let i = 0; i < content.length; i++) {
    if (content[i] === start) {
      depth++
    } else if (content[i] === end) {
      depth--
    }
    text += content[i]
    if (depth === 0) {
      break
    }
  }
  return text;
}

const selectNextValue = (content: string) => {
  content = removeFirstComma(content)
  if (content.startsWith('{')) {
    return selectBoundedText(content, '{', '}')
  }
  if (content.startsWith('[')) {
    return selectBoundedText(content, '[', ']')
  }
  if (content.startsWith('"')) {
    return `"${content.slice(1, content.slice(1).indexOf('"') + 1)}"`
  }
  if (content.startsWith(`h`)) {
    return `h${content.slice(1, content.slice(2).indexOf(`'`) + 3)}`
  }
  let indexOfFirstComma = content.indexOf(',');
  if (indexOfFirstComma === -1) {
    indexOfFirstComma = content.length
  }
  const untilComma = content.slice(0, indexOfFirstComma).trim();
  if (`${parseInt(untilComma, 10)}` === untilComma) {
    return untilComma;
  }
  if (['true', 'false'].includes(untilComma)) {
    return untilComma;
  }
  throw new Error('Unknown content: ' + content)
}

class EDNBase {
  public tag?: number
}

class EDNLabel extends EDNBase {
  constructor(public label: string | number) {
    super();
    if (`${label}`.startsWith('"')) {
      this.label = `${label}`.slice(1, `${label}`.length - 1)
    } else {
      this.label = parseInt(label as string, 10)
    }
  }
}

export class EDNMap extends EDNBase {
  public entries = [] as any[]
  add(key: any, value: any) {
    this.entries.push([key, value])
  }
  get(label: string | number) {
    const entry = this.entries.find(([k, v]) => {
      return k.label === label
    })
    return entry
  }
}

export class EDNSeq extends EDNBase {
  public entries = [] as any[]
  add(value: any) {
    this.entries.push(value)
  }
  get(index: number) {
    return this.entries[index]
  }
}

class EDNBytes extends EDNBase {
  public value: Buffer
  // h'facade'
  constructor(text: string) {
    super();
    this.value = Buffer.from(text.split(`'`)[1], 'hex')
  }
}

class EDNNumber extends EDNBase {
  public value: number
  // h'facade'
  constructor(value: string) {
    super();
    this.value = parseInt(value, 10)
  }
}

class EDNBoolean extends EDNBase {
  public value: boolean
  // h'facade'
  constructor(value: string) {
    super();
    this.value = value === 'true'
  }
}

class EDNTextString extends EDNBase {
  constructor(public value: string) {
    super();
    if (`${value}`.startsWith('"')) {
      this.value = `${value}`.slice(1, `${value}`.length - 1)
    }
  }
}

export class EDNCoseSign1 {
  public tag: number = 18
  public seq: EDNSeq
  public nested: any[] = []
  constructor(seq: EDNSeq) {
    this.seq = seq;
  }
  protectedHeader() {
    return this.seq.get(0)
  }

  diagnoseNested = async () => {
    const diag = await diagnose(this.protectedHeader().value)
    const doc = await unwrap(diag.trim())
    this.nested.push(doc)
  }

  signatureAlgorithm(){
    const alg = this.nested[0].get(1)[1]
    alg.comment = coseAlgs.algLabelToAlgName.get(alg.value)
    return alg
  }

}

const removeFirstComma = (text: string) => {
  if (text.trim().startsWith(',')) {
    return text.trim().slice(1)
  }
  return text.trim();
}

const unwrapSeq = async (content: string) => {
  if (!isSeq(content)) {
    throw new Error('unwrapSeq called on non seq')
  }
  let seq = new EDNSeq();
  let unwrapped = content.slice(1, content.length - 1).trim()
  while (unwrapped.length) {
    const value = selectNextValue(unwrapped)
    if (value.length) {
      seq.add(await unwrap(value))
      unwrapped = unwrapped.replace(value, '')
    }
    unwrapped = removeFirstComma(unwrapped)
  }
  return seq;
}

const unwrapMap = async (content: string) => {
  if (!isMap(content)) {
    throw new Error('unwrapMap called on non map')
  }
  let map = new EDNMap();
  let unwrapped = content.slice(1, content.length - 1)
  while (unwrapped.length) {
    const label = getSymbolBefore(unwrapped, ':');
    unwrapped = unwrapped.replace(`${label}: `, '').trim()
    const value = selectNextValue(unwrapped)
    if (value.length) {
      map.add(new EDNLabel(label), await unwrap(value))
      unwrapped = unwrapped.replace(value, '')
      unwrapped = removeFirstComma(unwrapped)
    }
  }
  return map;
}


const postProcessCoseSign1 = async (data: EDNSeq) => {
  const signature = new EDNCoseSign1(data)
  await signature.diagnoseNested();
  return signature;
}

const postProcessByTag = async (data: EDNBase) => {
  if (data.tag === 18) {
    return postProcessCoseSign1(data as EDNSeq)
  }
  return data;
}

export const unwrap = async (content: string) => {
  let data;
  let tag = getTag(content)
  if (tag) {
    content = removeTag(content)
  }
  if (isMap(content)) {
    data = await unwrapMap(content)
  } else if (isSeq(content)) {
    data = await unwrapSeq(content)
  } else if (isBytes(content)) {
    data = new EDNBytes(content)
  } else if (isTextString(content)) {
    data = new EDNTextString(content)
  } else if (isNumber(content)) {
    data = new EDNNumber(content)
  } else if (isBoolean(content)) {
    data = new EDNBoolean(content)
  } else {
    throw new Error('Failed to parse EDN for ' + content)
  }
  if (data && tag) {
    data.tag = parseInt(tag, 10)
    return await postProcessByTag(data)
  }
  return data
}