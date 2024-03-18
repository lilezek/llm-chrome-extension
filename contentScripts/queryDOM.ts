function GetCcssPathFromElement(el: Node | null) {
    const path: string[] = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el instanceof Element && el.id) {
            selector += '#' + CSS.escape(el.id);
            // Break if the id is unique
            if (document.querySelectorAll(selector).length === 1) {
                path.unshift(selector);
                break;
            }
        } else {
            let sibling: Node | null = el;
            let nth = 0;
            do {
                sibling = sibling.previousSibling;
                nth++;
            } while (sibling && sibling.nodeType === Node.ELEMENT_NODE)
            selector += ":nth-child(" + nth + ")";
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(" > ");
}

// From https://stackoverflow.com/a/12418814/2832398
function inViewport(el: Element) {
    const html = document.documentElement;
    const rect = el.getBoundingClientRect();

    return !!rect &&
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.left <= html.clientWidth &&
        rect.top <= html.clientHeight;
}

export function getFullDOM() {
    return document.documentElement.outerHTML;
}

export function getTabbableVisibleElements(intention?: "click" | "type") {
    const query = intention === "type" ? 'input, textarea, [contenteditable]' : 'a, button, input, select, textarea, [tabindex], [contenteditable]';
    return Array.from(document.querySelectorAll(query))
        .filter((el) => {
            if (!el.checkVisibility() || !inViewport(el)) {
                return false;
            }

            if (el instanceof HTMLAnchorElement && !el.href) {
                return false;
            }

            if (el instanceof HTMLButtonElement && el.disabled) {
                return false;
            }

            if (el instanceof HTMLInputElement && el.disabled) {
                return false;
            }

            if (el instanceof HTMLSelectElement && el.disabled) {
                return false;
            }

            if (el instanceof HTMLTextAreaElement && el.disabled) {
                return false;
            }

            if (el instanceof HTMLElement && el.tabIndex === -1) {
                return false;
            }

            return true;
        }).map((el) => {
            return { html: el.outerHTML, selector: GetCcssPathFromElement(el) };
        });
}

export function XPath(xpath: string) {
    const result = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    if (!result) {
        return [];
    }

    const nodes = [];
    let currentNode = result.iterateNext();
    while (currentNode) {
        if (currentNode instanceof HTMLElement) {
            nodes.push(currentNode.outerHTML);
        }
        currentNode = result.iterateNext();
    }
    return nodes;
}
