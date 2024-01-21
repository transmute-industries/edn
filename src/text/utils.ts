






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
  return content.slice(indexOfFirstParen+1, content.length - 1)
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
  public tag ?: number
}

class EDNLabel extends EDNBase {
  constructor(public label: string | number) {
    super();
    if (`${label}`.startsWith('"')) {
      this.label = `${label}`.slice(1, `${label}`.length - 1)
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

class EDNBytes extends EDNBase{
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

const removeFirstComma = (text: string) => {
  if (text.trim().startsWith(',')) {
    return text.trim().slice(1)
  }
  return text.trim();
}

const unwrapSeq = (content: string) => {
  if (!isSeq(content)) {
    throw new Error('unwrapSeq called on non seq')
  }
  let seq = new EDNSeq();
  let unwrapped = content.slice(1, content.length - 1).trim()
  while (unwrapped.length) {
    const value = selectNextValue(unwrapped)
    if (value.length) {
      seq.add(unwrap(value))
      unwrapped = unwrapped.replace(value, '')
    }
    unwrapped = removeFirstComma(unwrapped)
  }
  return seq;
}

const unwrapMap = (content: string) => {
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
      map.add(new EDNLabel(label), unwrap(value))
      unwrapped = unwrapped.replace(value, '')
      unwrapped = removeFirstComma(unwrapped)
    }
  }
  return map;
}

export const unwrap = (content: string) => {
  let data;
  let tag = getTag(content)
  if (tag) {
    content = removeTag(content)
  }
  if (isMap(content)) {
    data = unwrapMap(content)
  } else if (isSeq(content)) {
    data = unwrapSeq(content)
  } else if (isBytes(content)) {
    data = new EDNBytes(content)
  } else if (isTextString(content)) {
    data = new EDNTextString(content)
  } else if (isNumber(content)) {
    data = new EDNNumber(content)
  } else if (isBoolean(content)) {
    data = new EDNBoolean(content)
  }
  if (data && tag){
    data.tag = parseInt(tag, 10)
  }
  if (data === undefined){
    throw new Error('Failed to parse EDN.')
  }
  return data
}