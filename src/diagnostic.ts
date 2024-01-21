


import { diagnose} from 'cbor'

export { diagnose }

type EdnKey = Map<any, any>
type EdnValue = Map<any, any> | null

const selectValue = (content: string)=>{
  if (content.startsWith('[')){
    return selectSequence(content)
  }
  if (content.startsWith(`h'`)){
    return selectBytes(content)
  }

  return content.slice(0, content.indexOf(',')).trim()
  // throw new Error('unsupported selection for --> '+ content)
}

const selectBytes = (content:string)=> {
  if (!content.startsWith(`h'`)){
    throw new Error(`must be called on bytes that start with h'`)
  }
  let sequence = ''
  for (let i=2; i < content.length; i++){
    if (content[i] === `'`){
      break
    }
    if (i > 0){
      sequence = sequence + content[i]
    }
    
  }
  return `h'${sequence}'`;
}

const selectSequence = (content:string)=> {
  if (!content.startsWith('[')){
    throw new Error('must be called on sequence')
  }
  let depth = 0; // we will need this for nested arrays
  let sequence = ''
  for (let i=0; i < content.length; i++){
    if (i > 0){
      // if (content[i] === ']')
      sequence = sequence + content[i]
    }
    if (i > 0 && content[i] === '['){
      depth++
    }
    if (depth === 0 && content[i] === ']'){
      break
    } else {
      depth--;
    }
    
  }
  return `[${sequence}`;
}



export const extractStringNodeContent = (content: string, map: Map<any, any> = new Map())=>{
  map.set('label', content.slice(1, content.length-1).trim())
  return map
}

export const extractBooleanNodeContent = (content: string, map: Map<any, any> = new Map())=>{
  map.set('label', content === 'true')
  return map
}

export const extractIntegerNodeContent = (content: string, map: Map<any, any> = new Map())=>{
  map.set('label', parseInt(content, 10))
  return map
}

export const extractBytesContent = (content: string, map: Map<any, any> = new Map())=>{
  map.set('label', Buffer.from(content.split(`'`)[1], 'hex'))
  return map
}

export const extractContent = (content: string)=>{
  const trimmed = content.trim();
  if (trimmed.startsWith('[')){
    return extractSequenceNodeContent(content)
  }
  if (trimmed.startsWith('{')){
    return extractMapNodeContent(content)
  }
  if (trimmed.startsWith('"')){
    return extractStringNodeContent(content)
  }
  if (trimmed === 'false' || trimmed === 'true'){
    return extractBooleanNodeContent(content)
  }
  if (`${parseInt(trimmed, 10)}` === trimmed){
    return extractIntegerNodeContent(content)
  }
  if (trimmed.startsWith(`h'`)){
    return extractBytesContent(content)
  }
  throw new Error('cannot extract content: ' + content)
}

// extra terrible
const getSequenceDepth = (content:string, start: string, end: string) => {
  let depth = 0;
  const map: any = {
    'depth_0': ''
  };
  for (let i = 1; i <= content.length-1; i++){
    if (content[i] === start){
      depth++
    } else if (content[i] === end){
      depth--
    } else {
      if (!map[`depth_${depth}`]){
        map[`depth_${depth}`] = ''
      }
      map[`depth_${depth}`] += content[i]
    }
  }
  return map as any
}

// terrible
const extractSequenceNodeContent = (content: string): any =>{
  let sequenceDepth = getSequenceDepth(content, '[', ']')
  let sequence = [...sequenceDepth['depth_0'].split(',').map((i:any)=>i.trim()).filter((i:any)=> !!i).map((extractContent))] as any;
  const contentWithoutDepth0 = content.replace(sequenceDepth['depth_0'], '')
  if (contentWithoutDepth0.length){
    const remaining = extractSequenceNodeContent(contentWithoutDepth0.slice(1, contentWithoutDepth0.length-1))
    if (remaining.length){
      return [...sequence, remaining]
    }
  } 
  return sequence
}

const removeCommaPrefix = (content: string)=>{
  const trimmed = content.trim()
  if (trimmed.startsWith(`,`)){
    return trimmed.slice(1).trim()
  }
  return trimmed;
}

export const extractMapNodeContent = (content: string, map: Map<any, any> = new Map()) => {
  let innerContent = content.slice(1, content.length-1).trim()
  let lastInnerContent = innerContent;
  while (innerContent.length){
    const indexOfNextKey = innerContent.indexOf(':');
    const nextKey = innerContent.slice(0, indexOfNextKey)
    const nextValueAndRest = innerContent.slice(indexOfNextKey+1).trim()
    const nextValue = selectValue(nextValueAndRest)
    const ednKey = new Map();
    ednKey.set('label', nextKey.slice(1, nextKey.length-1).trim())
    const ednValue = extractContent(nextValue);
    map.set(ednKey, ednValue)
    innerContent = removeCommaPrefix(nextValueAndRest.slice(nextValueAndRest.indexOf(nextValue) + nextValue.length).trim()) 
    if (lastInnerContent === innerContent){
      break
    } else {
      lastInnerContent = innerContent
    }
  }
  return map;
}

export const parse = (edn: string) => {
  let map = new Map();
  const trimmed = edn.trim();
  if (trimmed.startsWith('{')){
    map = extractMapNodeContent(trimmed, map)
  } else if (trimmed.startsWith('[')){
    map = extractSequenceNodeContent(trimmed)
  } else {
    throw new Error('can only be called on maps or sequences')
  }
  return map;
}