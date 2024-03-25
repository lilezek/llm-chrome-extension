import { Tab as ExtensionTab } from "../extension/browser/browser.js";

let responsePromiseSolver: (value: unknown) => void;

window.addEventListener('message', async (event) => {
    const { data } = event;
    const { type, result } = data;

    if (type === "tab_response") {
        responsePromiseSolver(result);
    }
});

function callExtensionTab(method: string, ...args: unknown[]) {
    const responsePromise = new Promise((resolve) => {
        responsePromiseSolver = resolve;
    });

    window.parent.postMessage({ type: "tab", method, args }, '*');

    return responsePromise;
}

export const Tab = {} as ExtensionTab;

// For every method in the prototype of ExtensionTab, create a function that calls the method in the extension
for (const method of Object.getOwnPropertyNames(ExtensionTab.prototype)) {
    if (method === "constructor") {
        continue;
    }

    // @ts-expect-error I'm accessing Tab with method which is part of the prototype of ExtensionTab
    Tab[method] = 
    async function (...args: unknown[]) {
        return callExtensionTab(method, ...args);
    };
}