import { ClientsideFunctionArgs, ClientsideFunctionReturn, ClientsideFunctions } from "../../contentScripts/main.js";

type RunInClientResult<Return> = Pick<chrome.scripting.InjectionResult, Exclude<keyof chrome.scripting.InjectionResult, "result">> & { result: Return };

export abstract class Tab {
    private lastSelectedElement: {
        selector?: string;
        xpath?: string;
    } = {};

    protected abstract runInClient<F extends ClientsideFunctions>(func: F, ...args: ClientsideFunctionArgs<F>): Promise<(RunInClientResult<ClientsideFunctionReturn<F>>)[]>;
    abstract waitUntilReady(): Promise<void>;
    protected abstract navigateToImpl(url: string): Promise<void>;
    protected abstract findElementImpl(description: string, intention: "click" | "type" | "select"): Promise<void>;
    protected abstract findInTextImp(description: string): Promise<string>;

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
        await this.runInClient("clickElement", this.lastSelectedElement);
    }

    async sendKeysToElement(...keys: Array<string | number>) {
        await this.waitUntilReady();
        await this.runInClient("sendKeysToElement", this.lastSelectedElement, ...keys);
    }

    async navigateTo(url: string) {
       const p = this.navigateToImpl(url);
       return p;
    }

    async findElement(description: string, intention: "click" | "type" | "select") {
        await this.waitUntilReady();
        return this.findElementImpl(description, intention);
    }

    async findInText(description: string) {
        await this.waitUntilReady();
        return this.findInTextImp(description);
    }
}