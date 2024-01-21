






const isMap = (content: string) => content.startsWith('{') && content.endsWith('}')

const isSeq = (content: string) => content.startsWith('[') && content.endsWith(']')

const isBytes = (content: string) => content.startsWith(`h'`) && content.endsWith(`'`)


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

class EDNLabel {
  constructor(public label: string | number) {
    if (`${label}`.startsWith('"')){
      this.label = `${label}`.slice(1, `${label}`.length-1)
    }
  }
}

export class EDNMap {
  public entries = [] as any[]
  addEntry(key: any, value: any) {
    this.entries.push([key, value])
  }

  get(label: string | number){
    const entry = this.entries.find(([k, v])=>{
      return k.label === label
    })
    return entry
  }
}

export class EDNSeq {
  public entries = [] as any[]
  addEntry(value: any) {
    this.entries.push(value)
  }
}

class EDNBytes {
  public value: Buffer
  // h'facade'
  constructor(text: string) {
    this.value = Buffer.from(text.split(`'`)[1], 'hex')
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
      seq.addEntry(unwrap(value))
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
      map.addEntry(new EDNLabel(label), unwrap(value))
      unwrapped = unwrapped.replace(value, '')
      unwrapped = removeFirstComma(unwrapped)
    }
  }
  return map;
}


export const unwrap = (content: string) => {
  if (isMap(content)) {
    return unwrapMap(content)
  }
  if (isSeq(content)) {
    return unwrapSeq(content)
  }
  if (isBytes(content)) {
    return new EDNBytes(content)
  }
  return content
}