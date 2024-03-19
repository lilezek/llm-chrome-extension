import { Tab } from "../browser/browser.js";

export class SandboxContext {
    private iframe: HTMLIFrameElement;
    private readyPromise: Promise<void>;

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
            const { type, method, args } = data;
            
            if (type === "tab") {
                const result = await (this.tab as any)[method](...args);
                // Send the result back to the iframe
                this.iframe.contentWindow!.postMessage({ type: "tab_response", result }, '*');
            }
        });
    }

    dispose() {
        document.body.removeChild(this.iframe);
    }

    async eval(code: string, ...args: any[]) {
        await this.readyPromise;
        // Send a message to the iframe contining the code to be executed
        this.iframe.contentWindow!.postMessage({ type: "eval", code, args }, '*');
    }
}

