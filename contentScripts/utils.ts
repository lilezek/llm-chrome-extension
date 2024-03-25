export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface Selector {
    // xpath selector
    xpath?: string;

    // css selector
    selector?: string;
}

export function SelectOneElement(selector: Selector) {
    if (selector.xpath) {
        const result = document.evaluate(selector.xpath, document, null, XPathResult.ANY_TYPE, null);
        if (!result) {
            return null;
        }
        let node = result.iterateNext();
        while (node !== null) {
            if (node instanceof HTMLElement) {
                return node;
            }
            node = result.iterateNext();
        }
    } else if (selector.selector) {
        return document.querySelector(selector.selector) as HTMLElement | null;
    }
    return null;
}

