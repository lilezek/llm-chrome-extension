import { ClientsideFunctionArgs, ClientsideFunctionReturn, ClientsideFunctions } from "../../contentScripts/main.js";

type RunInClientResult<Return> = Pick<chrome.scripting.InjectionResult, Exclude<keyof chrome.scripting.InjectionResult, "result">> & { result: Return };

export type Element = {
    selector?: string;
    xpath?: string;
};

export abstract class Tab {
    protected abstract runInClient<F extends ClientsideFunctions>(func: F, ...args: ClientsideFunctionArgs<F>): Promise<(RunInClientResult<ClientsideFunctionReturn<F>>)[]>;
    abstract waitUntilReady(): Promise<void>;
    protected abstract navigateToImpl(url: string): Promise<void>;
    protected abstract findElementImpl(description: string, intention: "click" | "type" | "select"): Promise<Element>;
    protected abstract findInTextImp(description: string): Promise<string>;

    async sleep(ms: number) {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async clickElement(el: Element) {
        await this.waitUntilReady();
        await this.runInClient("clickElement", el);
    }

    async sendKeysToElement(el: Element, ...keys: Array<string | number>) {
        await this.waitUntilReady();
        await this.runInClient("sendKeysToElement", el, ...keys);
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