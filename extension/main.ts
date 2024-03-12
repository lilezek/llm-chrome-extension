import { BrowsingContent } from "./browser/chrome.js";
import { KeyCodes } from "../contentScripts/interact.js";
import llm_selector from "./AI/llm_selector.js";

const ctx = new BrowsingContent();

document.getElementById('exec')!.addEventListener('click', async () => {
    const tab = await ctx.getCurrentTab();
    await tab.navigateTo('https://web.telegram.org');
    
    const source = await tab.getSource();
    
    for await (const res of llm_selector.findXPath(source, 'Telegram', 'Alfredo Rubio')) {
        await res.save();
        tab.setLastElementXPath(res.xpath);
    }

    await tab.clickElement();
});