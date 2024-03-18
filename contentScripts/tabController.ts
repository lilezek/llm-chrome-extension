type RunInClientResult<Return> = Pick<chrome.scripting.InjectionResult, Exclude<keyof chrome.scripting.InjectionResult, "result">> & { result: Return };

export class Tab {
    private lastSelectedElement: {
        selector?: string;
        xpath?: string;
    } = {};
    private implicitWaitPromise: Promise<void> | null = null;
    private title: string = "";
    private url: string = "";

    constructor(private chromeTab: chrome.tabs.Tab) {}

    private setLastElementSelector(selector: string) {
        this.lastSelectedElement = {
            selector
        };
    }

    private setLastElementXPath(xpath: string) {
        this.lastSelectedElement = {
            xpath
        };
    }

    implicitWait() {
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

    private async getSource() {
        await this.implicitWait();
        return this.runInClient(this.chromeTab.id!, "getFullDOM")
            .then((a) => a[0].result);
    }

    /**
     * @returns A list of strings (html) representing the tabbable elements in the page.
     */
    private async getTabbableVisibleElements(intention?: "click" | "type") {
        await this.implicitWait();
        return this.runInClient(this.chromeTab.id!, "getTabbableVisibleElements", intention)
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

    async findElement(description: string, intention: "click" | "type") {
        chat.writeAssistantMessage(`Finding element: ${description}`);
        const context = `${this.title} - ${this.url}`;

        // First, try to find the element from tabbable elements
        const tabbable = await this.getTabbableVisibleElements(intention);
        console.log(tabbable);
        const elements = tabbable.map((el) => el.html);
        const selectors = tabbable.map((el) => el.selector);
        const found = await llm_selector.findInList(elements, context, description);
        if (found !== -1) {
            console.log(selectors[found]);
            this.setLastElementSelector(selectors[found]);
            return;
        }

        // If not found, try to find the element from the whole page
        const source = await this.getSource();
        for await (const res of llm_selector.findXPath(source, context, description)) {
            if (!res.cached) {
                await res.save();
            }
            console.log(res.xpath);
            this.setLastElementXPath(res.xpath);
            return;
        }

        chat.writeAssistantMessage(`Element not found: ${description}`);
        throw new Error(`Element not found: ${description}`);
    }
}