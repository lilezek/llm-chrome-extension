import { ClientsideFunctionArgs, ClientsideFunctionReturn, ClientsideFunctions } from "../../contentScripts/main.js";

type RunInClientResult<Return> = Pick<chrome.scripting.InjectionResult, Exclude<keyof chrome.scripting.InjectionResult, "result">> & { result: Return };

export abstract class Tab {
    private lastSelectedElement: {
        selector?: string;
        xpath?: string;
    } = {};

    protected abstract injectContentScript(): Promise<void>;
    protected abstract runInClient<F extends ClientsideFunctions>(func: F, ...args: ClientsideFunctionArgs<F>): Promise<(RunInClientResult<ClientsideFunctionReturn<F>>)[]>;
    abstract waitUntilReady(): Promise<void>;
    protected abstract navigateToImpl(url: string): Promise<void>;
    protected abstract findElementImpl(description: string, intention: "click" | "type"): Promise<void>;

    protected setLastElementSelector(selector: string) {
        this.lastSelectedElement = {
            selector
        };
    }

    protected setLastElementXPath(xpath: string) {
        this.lastSelectedElement = {
            xpath
        };
    }

    async sleep(ms: number) {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async clickElement() {
        await this.waitUntilReady();
        this.runInClient("clickElement", this.lastSelectedElement);
    }

    async sendKeysToElement(...keys: Array<string | number>) {
        await this.waitUntilReady();
        this.runInClient("sendKeysToElement", this.lastSelectedElement, ...keys);
    }

    async navigateTo(url: string) {
       return this.navigateToImpl(url);
    }

    async findElement(description: string, intention: "click" | "type") {
        return this.findElementImpl(description, intention);
    }
}