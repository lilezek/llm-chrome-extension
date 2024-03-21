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

/**
 * Recursively iterates over all elements, discarding not visible elements, style and script tags.
 */
export function getFullText(root = document.documentElement) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (node.parentElement) {
                if (!node.parentElement.checkVisibility()) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (node.parentElement instanceof HTMLStyleElement || node.parentElement instanceof HTMLScriptElement) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Inside viewport
                if (!inViewport(node.parentElement)) {
                    return NodeFilter.FILTER_REJECT;
                }
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const texts: string[] = [];
    while (walker.nextNode()) {
        if (walker.currentNode.nodeValue && walker.currentNode.nodeValue.trim()) {
            texts.push(walker.currentNode.nodeValue.trim());
        }
    }
    return texts.join("\n");
}
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
