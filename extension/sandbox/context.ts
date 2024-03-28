import { Tab } from "../browser/browser.js";

export class SandboxContext {
    private iframe: HTMLIFrameElement;
    private readyPromise: Promise<void>;
    private responsePromiseSolver?: (value: unknown) => void;

    constructor(private tab: Tab) {
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'sandbox.html';
        this.iframe.style.display = 'none';
        document.body.appendChild(this.iframe);
        this.readyPromise = new Promise((resolve) => {
            // Wait for the iframe to load
            this.iframe.onload = () => {
                resolve();
            };
        });

        // Calls methods in the tab object
        window.addEventListener('message', async (event) => {
            // Check if the message is from the iframe
            if (event.source !== this.iframe.contentWindow) {
                return;
            }

            const { data } = event;
            const { type, method, args, result } = data;
            
            if (type === "tab") {
                // @ts-expect-error I'm calling a method on the tab object and there is no suitable type for this
                const methodResult = await this.tab[method](...args);
                // Send the result back to the iframe
                this.iframe.contentWindow!.postMessage({ type: "tab_response", result: methodResult }, '*');
            } else if (type === "eval_response") {
                this.responsePromiseSolver?.(result);
                this.responsePromiseSolver = undefined;
            }
        });
    }

    dispose() {
        document.body.removeChild(this.iframe);
    }

    async eval(code: string, ...args: unknown[]) {
        await this.readyPromise;

        const responsePromise = new Promise((resolve) => {
            this.responsePromiseSolver = resolve;
        });

        this.iframe.contentWindow!.postMessage({ type: "eval", code, args }, '*');

        return responsePromise;
    }
}

