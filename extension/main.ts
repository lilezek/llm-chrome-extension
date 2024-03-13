import { BrowsingContent } from "./browser/chrome.js";
import { KeyCodes } from "../contentScripts/interact.js";
import chat from "./chat/chat.js";
import { sleep } from "../contentScripts/utils.js";

const ctx = new BrowsingContent();

chat.writeAssistantMessage('Hello!');

document.getElementById('exec')!.addEventListener('click', async () => {
    const tab = await ctx.getCurrentTab();
    await tab.navigateTo('https://web.telegram.org');
    
    await tab.findElement('Alfredo Rubio');
    await tab.clickElement();
    await sleep(1000);

    await tab.findElement('Write a message bar');
    await tab.sendKeysToElement('Hello, Alfredo!', KeyCodes.Enter);    
});