import { ClientsideFunctionArgs, ClientsideFunctionReturn, ClientsideFunctions } from "../../contentScripts/main.js";
import { ChatGPTChat } from "../AI/chatgpt.js";
import llm_selector from "../AI/llm_selector.js";
import chat from "../chat/chat.js";
import { Tab } from "./browser.js";

export class ChromeBrowsingContext {
    private tabs: Map<number, ChromeTab> = new Map();

    constructor(private chatgpt: ChatGPTChat) { }

    async getCurrentTab() {
        const tabId = await new Promise<number>((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!this.tabs.has(tabs[0].id!)) {
                    this.tabs.set(tabs[0].id!, new ChromeTab(tabs[0], this.chatgpt));

                }
                resolve(tabs[0].id!);
            });
        });
        const tab = this.tabs.get(tabId)!;
        await tab.waitUntilReady();
        return tab;
    }
}

type RunInClientResult<Return> = Pick<chrome.scripting.InjectionResult, Exclude<keyof chrome.scripting.InjectionResult, "result">> & { result: Return };

export class ChromeTab extends Tab {
    private implicitWaitPromise: Promise<void> | null = null;
    private title: string = "";
    private url: string = "";

    constructor(private chromeTab: chrome.tabs.Tab, private chatgpt: ChatGPTChat) {
        super();
        this.chromeTab = chromeTab;
        this.title = chromeTab.title ?? "";
        this.url = chromeTab.url ?? "";

        let solver: () => void = () => { };
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (tab.title) {
                this.title = tab.title;
            }

            if (tab.url) {
                this.url = tab.url;
            }

            if (tabId === this.chromeTab.id && changeInfo.status === "loading") {
                this.implicitWaitPromise = this.implicitWaitPromise ??
                    new Promise<void>((resolve) => {
                        solver = resolve;
                    });
            }

            if (tabId === this.chromeTab.id && changeInfo.status === "complete") {
                this.injectContentScript()
                    .then(() => {
                        console.log("Smart browsing: content script injected");
                        solver();
                        this.implicitWaitPromise = null;
                    });
            }
        });

        this.implicitWaitPromise = this.injectContentScript();
    }

    private async getSource() {
        await this.waitUntilReady();
        return this.runInClient("getFullDOM")
            .then((a) => a[0].result);
    }

    /**
    * @returns A list of strings (html) representing the tabbable elements in the page.
    */
    private async getTabbableVisibleElements(intention?: "click" | "type" | "select") {
        await this.waitUntilReady();
        return this.runInClient("getTabbableVisibleElements", intention)
            .then((a) => a[0].result);
    }

    protected override runInClient<F extends ClientsideFunctions>(func: F, ...args: ClientsideFunctionArgs<F>) {
        return chrome.scripting.executeScript({
            target: { tabId: this.chromeTab.id! },
            func: ((f: string, ...args: any[]) => (window as any).smartBrowsing[f](...args)) as any,
            args: [func, ...args],
            world: "MAIN"
        }) as Promise<(RunInClientResult<ClientsideFunctionReturn<F>>)[]>;
    }

    protected override injectContentScript() {
        return new Promise<void>((resolve) => {
            chrome.scripting.executeScript({
                target: { tabId: this.chromeTab.id! },
                files: ["dist/contentScripts/bundle.js"],
                world: "MAIN"
            }, (result) => {
                resolve();
            });
        });
    }

    protected override async findInTextImp(description: string): Promise<string> {
        const textContentResult = await this.runInClient("getFullText");
        return this.chatgpt.findInText(description, textContentResult[0].result);
    }

    override async waitUntilReady() {
        if (this.implicitWaitPromise) {
            return this.implicitWaitPromise;
        }
    }

    protected async navigateToImpl(url: string) {
        await chrome.tabs.update(
            this.chromeTab.id!,
            {
                url
            });
    }

    getImplementation() {
        return this.chromeTab;
    }

    async findElementImpl(description: string, intention: "click" | "type" | "select") {
        chat.writeAssistantMessage(`Finding element: ${description}`);
        const context = `${this.title} - ${this.url}`;

        // First, try to find the element from tabbable elements
        const tabbable = await this.getTabbableVisibleElements(intention);
        const elements = tabbable.map((el) => el.html);
        const selectors = tabbable.map((el) => el.selector);
        const found = await llm_selector.findInList(elements, context, description);
        if (found !== -1) {
            if (DEBUG) {
                console.log(`Element found from tabbable elements: ${selectors[found]}`);
            }
            this.setLastElementSelector(selectors[found]);
            return;
        }

        // If not found, try to find the element from the whole page
        const source = await this.getSource();
        for await (const res of llm_selector.findXPath(source, context, description)) {
            if (!res.cached) {
                await res.save();
            }
            if (DEBUG) {
                console.log(`Element found from whole page: ${res.xpath}`);
            }
            this.setLastElementXPath(res.xpath);
            return;
        }

        chat.writeAssistantMessage(`Element not found: ${description}`);
        throw new Error(`Element not found: ${description}`);
    }
}