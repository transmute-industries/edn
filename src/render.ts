import {EDNCoseSign1, EDNMap, EDNSeq} from "./text";

import {parse} from "./parse";

import {urn} from "./identifiers";

import {IANACOSEHeaderParameter} from "./cose/headers";

export const render = async (message: Buffer, contentType: string = 'text/html') => {
    const graph = await parse(message) as EDNCoseSign1
    if (graph.tag !== 18) {
        throw new Error('Only tagged cose-sign1 are supported')
    }
    const id = urn('cose', 'cose-sign1', message);
    switch (contentType) {
        case 'text/html':
            return renderHtml(id, graph)
        case 'text/plain':
            return renderPlaintext(id, graph)
        default:
            throw new Error('Only text/html and text/plain are supported')
    }
}

export const renderHtml = async (id: string, graph: EDNCoseSign1) => {
    return `
<section id="${id}" class="edn-cose-sign1">
  <style>
  ${style}
  </style>

/ cose-sign1 / 18([ 
${recursiveRenderHtml(graph.seq)}
])

${recursiveRenderNestedHtml(graph)}

<section>
  `.trim();
}

const recursiveRenderNestedHtml = (graph: EDNCoseSign1): string => {
    const items = [] as string[]
    for (const item of graph.nested) {
        items.push(`
    <section class="decoded-nested">
${recursiveRenderHtml(item)}
    </section>
    `)
    }
    return items.join('\n')
}

const renderSeqHtml = (seq: EDNSeq) => {
    const rows = seq.entries.map((entry: any, index: number) => {
        let trailingComma = index === seq.entries.length - 1 ? '' : ','
        let item = `<li>${entry.edn}${trailingComma}</li>`
        if (!entry.edn) {
            item = `<li>${recursiveRenderHtml(entry)}${trailingComma}</li>`
        }
        return item
    })

    return `<ol>${rows.join('\n')}</ol>`
}

const renderMapHtml = (map: EDNMap) => {
    const rows = map.entries.map(([key, value]) => {
        let htmlValue = value.edn;
        if (!htmlValue) {
            htmlValue = recursiveRenderHtml(value)
        }
        let htmlKey = `${key.label}: `
        if (key.iana) {
            const iana = key.iana as IANACOSEHeaderParameter
            htmlKey = `/ ${iana.Name} / ${iana.Label} : `
        }
        if (value.iana) {
            const iana = value.iana as IANACOSEHeaderParameter
            htmlValue = `/ ${iana.Name} / ${value.edn} `
        }
        return `<dt>${htmlKey}</dt><dd>${htmlValue}</dd>`
    })
    let mapComment = ''
    if (map.comment) {
        mapComment = `/ ${map.comment} / `
    }
    return `${mapComment}{<dl>${rows.join('\n')}<dl>}`
}

const recursiveRenderHtml = (graph: EDNSeq | EDNMap): string => {
    if (graph instanceof EDNSeq) {
        return renderSeqHtml(graph)
    } else if (graph instanceof EDNMap) {
        return renderMapHtml(graph)
    }
    console.error(graph);
    throw new Error("unsupported graph instance")
}

const style = `
    .edn-cose-sign1 { font-family: monospace; }
    .edn-cose-sign1 * { margin: 0; padding: 0; } 
    .edn-cose-sign1 dt { padding-right: 8px;}
    .edn-cose-sign1 dt, dd { display: inline-block; padding-left: 8px; }
    .edn-cose-sign1 ol li {
      list-style: none;
      padding-left: 8px;
    }
    .decoded-nested { margin: 8px }
`
export const renderPlaintext = async (id: string, graph: EDNCoseSign1): Promise<string> => {
    if (graph.tag !== 18) {
        throw new Error('Unsupported graph type for plaintext rendering.');
    }
    let plaintext: string = `18(\n   [\n`;
    // Start with an initial indentation level of 2 for consistent formatting
    plaintext += recursiveRenderPlaintext(graph.seq);
    plaintext += '\n   ]\n)\n\n';

    // TODO: decode the nested protected header in place
    // if (graph.nested && graph.nested.length > 0) {
    //     graph.nested.forEach((nestedGraph, index) => {
    //         plaintext += recursiveRenderPlaintext(nestedGraph);
    //     });
    // }
    return plaintext.trim();
};

const recursiveRenderPlaintext = (graph: EDNSeq | EDNMap): string => {
    if (graph instanceof EDNSeq) {
        return renderSeqPlaintext(graph);
    } else if (graph instanceof EDNMap) {
        return renderMapPlaintext(graph);
    } else {
        console.error("Unsupported graph instance:", graph);
        throw new Error("Unsupported graph instance for plaintext rendering.");
    }
};

const renderSeqPlaintext = (seq: EDNSeq): string => {
    return seq.entries.map((entry, index: number) => {
        let trailingComma: string = index < seq.entries.length - 1 ? ',' : '';
        return `${entry.edn ? '\t' + entry.edn : recursiveRenderPlaintext(entry)}${trailingComma}`;
    }).join('\n');
};

const renderMapPlaintext = (map: EDNMap): string => {
    let components: string[] = map.entries.map(([key, value]) => {
        let formattedKey: string = key.label;
        let formattedValue: string = value.edn || recursiveRenderPlaintext(value);
        if (key.iana) {
            const iana = key.iana;
            formattedKey = `/ ${iana.Name} / ${iana.Label} : `;
        }
        if (value.iana) {
            const iana = value.iana;
            formattedValue = `/ ${iana.Name} / ${value.edn} `;
        }
        return `\n\t\t${formattedKey} ${formattedValue}`;
    });
    let mapComment: string = map.comment ? `\t/ ${map.comment} / ` : '';
    return mapComment + components.join('\n');
};