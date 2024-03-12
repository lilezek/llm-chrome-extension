import { ClientsideFunctionArgs, ClientsideFunctionReturn, ClientsideFunctions } from "../../contentScripts/main.js";

export class BrowsingContent {
    private tabs: Map<number, Tab> = new Map();

    async getCurrentTab() {
        const tabId = await new Promise<number>((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!this.tabs.has(tabs[0].id!)) {
                    this.tabs.set(tabs[0].id!, new Tab(tabs[0], this));

                }
                resolve(tabs[0].id!);
            });
        });
        return this.tabs.get(tabId)!;
    }

    sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

type RunInClientResult<Return> = Pick<chrome.scripting.InjectionResult, Exclude<keyof chrome.scripting.InjectionResult, "result">> & { result: Return };

export class Tab {
    private lastSelectedElement: {
        selector?: string;
        xpath?: string;
    } = {};
    private implicitWaitPromise: Promise<void> | null = null;

    constructor(private chromeTab: chrome.tabs.Tab, private context: BrowsingContent) {
        this.chromeTab = chromeTab;

        let solver: () => void = () => {};
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            console.log(tabId, changeInfo, tab);

            if (tabId === this.chromeTab.id && changeInfo.status === "loading") {
                this.implicitWaitPromise = this.implicitWaitPromise ?? 
                    new Promise<void>((resolve) => {
                        solver = resolve;
                    });
            }

            if (tabId === this.chromeTab.id && changeInfo.status === "complete") {
                this.injectContentScript(tabId)
                    .then(() => {
                        console.log("Smart browsing: content script injected");
                        solver();
                        this.implicitWaitPromise = null;
                    });
            }
        });
    }

    private runInClient<F extends ClientsideFunctions>(tabId: number, func: F, ...args: ClientsideFunctionArgs<F>) {
        return chrome.scripting.executeScript({
            target: { tabId },
            func: ((f: string, ...args: any[]) => (window as any).smartBrowsing[f](...args)) as any,
            args: [func, ...args],
            world: "MAIN"
        }) as Promise<(RunInClientResult<ClientsideFunctionReturn<F>>)[]>;
    }

    private injectContentScript(tabId: number) {
        return new Promise<void>((resolve) => {
            chrome.scripting.executeScript({
                target: { tabId },
                files: ["dist/contentScripts/bundle.js"],
                world: "MAIN"
            }, (result) => {
                resolve();
            });
        });
    }

    private implicitWait() {
        if (this.implicitWaitPromise) {
            return this.implicitWaitPromise;
        }
    }

    async navigateTo(url: string) {
        await chrome.tabs.update(
            this.chromeTab.id!,
            {
                url
            });
    }

    async getSource() {
        await this.implicitWait();
        return this.runInClient(this.chromeTab.id!, "getFullDOM")
            .then((a) => a[0].result);
    }

    /**
     * @returns A list of strings (html) representing the tabbable elements in the page.
     */
    async getTabbableVisibleElements() {
        await this.implicitWait();
        return this.runInClient(this.chromeTab.id!, "getTabbableVisibleElements")
            .then((a) => a[0].result);
    }

    async clickElement() {
        await this.implicitWait();
        this.runInClient(this.chromeTab.id!, "clickElement", this.lastSelectedElement);
    }

    async sendKeysToElement(...keys: Array<string | number>) {
        await this.implicitWait();
        this.runInClient(this.chromeTab.id!, "sendKeysToElement", this.lastSelectedElement, ...keys);
    }

    setLastElementSelector(selector: string) {
        this.lastSelectedElement = {
            selector
        };
    }

    setLastElementXPath(xpath: string) {
        this.lastSelectedElement = {
            xpath
        };
    }
}