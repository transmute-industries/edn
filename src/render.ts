import { EDNCoseSign1, EDNMap, EDNSeq } from "./text";

import { parse } from "./parse";

import { urn } from "./identifiers";

import * as headers from './cose/headers'
import * as algs from './cose/alg'

export const render = async (message: Buffer, contentType: string = 'text/html') => {
    const graph = await parse(message) as EDNCoseSign1
    if (graph.tag !== 18) {
        throw new Error('Only tagged cose-sign1 are supported')
    }
    const id = urn('cose', 'cose-sign1', message);
    switch (contentType) {
        case 'application/cbor-diagnostic':
            return renderPlaintext(id, graph)
        default:
            throw new Error('Only application/cbor-diagnostic is supported')
    }
}

export const renderPlaintext = async (id: string, graph: EDNCoseSign1): Promise<string> => {
    if (graph.tag !== 18) {
        throw new Error('Unsupported graph type for plaintext rendering.');
    }
    let text: string = `/ cose-sign1 / 18([\n`;
    text += await recursiveRenderPlaintext(graph.seq);
    text += '\n])\n\n';
    return text.trim();
};

const recursiveRenderPlaintext = async (graph: EDNSeq | EDNMap): Promise<string> => {
    if (graph instanceof EDNSeq) {
        return await renderSeqPlaintext(graph);
    } else if (graph instanceof EDNMap) {
        return await renderMapPlaintext(graph);
    } else {
        console.error("Unsupported graph instance:", graph);
        throw new Error("Unsupported graph instance for plaintext rendering.");
    }
};

const renderSeqPlaintext = async (seq: EDNSeq): Promise<string> => {
    return (
        await Promise.all(
            seq.entries.map(async (entry, index: number) => {
                let trailingComma: string = index < seq.entries.length - 1 ? ',' : '';
                if (entry.edn && entry.edn.startsWith('/ protected /')) {
                    const protectedHeader = (await parse(entry.value) as EDNMap);
                    for (const [key, value] of protectedHeader.entries) {
                        const ianaRegisteredHeader = headers.IANACOSEHeaderParameters[`${key.label}`]
                        if (ianaRegisteredHeader) {
                            key.iana = ianaRegisteredHeader;
                        }
                        if (key.iana.Name === 'alg') {
                            value.iana = algs.IANACOSEHeaderParameters[`${value.value}`]
                        }
                    }
                    entry.edn = `/ protected / << ${await renderMapPlaintext(protectedHeader)} >>>`
                }
                return `${entry.edn ? '\t' + entry.edn : await recursiveRenderPlaintext(entry)}${trailingComma}`;
            }))).join('\n');
};

const renderMapPlaintext = async (map: EDNMap): Promise<string> => {
    let components: string[] = await Promise.all(map.entries.map(async ([key, value]) => {
        let formattedKey: string = key.label;
        let formattedValue: string = value.edn || await recursiveRenderPlaintext(value);
        if (key.iana) {
            const iana = key.iana;
            formattedKey = `/ ${iana.Name} / ${iana.Label} :`;
        }
        if (value.iana) {
            const iana = value.iana;
            formattedValue = `${value.edn.trim()} / ${iana.Name} /`;
        }
        return `\n\t\t${formattedKey} ${formattedValue}`;
    }));
    let mapComment: string = map.comment ? `\t/ ${map.comment} / ` : '';
    return mapComment + '{' + components.join('\n') + '\n\t}';
};