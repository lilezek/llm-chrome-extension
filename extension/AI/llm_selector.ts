import { LLMSelector } from "llm-xpath";
import { DOMParser as DependencyDOMParser } from "llm-xpath/dist/dependencies/dom.js";
import { XMLParser } from "llm-xpath/dist/dependencies/xml.js";
import { XPath } from "llm-xpath/dist/dependencies/xpath.js";
import { Storage } from "llm-xpath/dist/dependencies/storage.js";

const domParser = new DependencyDOMParser({
    parse: (html) => {
        const element = document.createElement('html');
        element.innerHTML = html;
        return element;
    }
});

const xmlParser = new XMLParser({
    parse: (xml) => {
        return new DOMParser().parseFromString(xml, 'text/html')
    }
});

const xpath = new XPath({
    select(query, document) {
        const result = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null);

        if (!result) {
            return [];
        }

        const nodes = [];
        let currentNode = result.iterateNext();
        while (currentNode) {
            nodes.push(currentNode);
            currentNode = result.iterateNext();
        }
        return nodes;
    },
});

const storage = new Storage({
    async getItem(key) {
        return localStorage.getItem(key);
    },
    async setItem(key, value) {
        return localStorage.setItem(key, value);
    }
});

export default new LLMSelector({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    domParser,
    xmlParser,
    xpath,
    storage
});