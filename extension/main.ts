import { BrowsingContent } from "./browser/chrome.js";
import { KeyCodes as Key} from "../contentScripts/interact.js";
import chat from "./chat/chat.js";
import { sleep } from "../contentScripts/utils.js";
import { ChatGPTChat } from "./AI/chatgpt.js";
import { Task } from "./tasks/task.js";

const ctx = new BrowsingContent();
const chatgpt = new ChatGPTChat(process.env.OPENAI_API_KEY!);

chat.writeAssistantMessage('Write your task, one step at a time. Write "done" when you are finished.');
const steps: string[] = [];

document.getElementById('send')!.addEventListener('click', async () => {
    const userInput = chat.readInput();
    if (userInput.trim().toLowerCase() === 'done') {
        chat.writeAssistantMessage('Generating task...');
        const codeString = await chatgpt.generateTasks(steps);
        chat.writeAssistantMessage(codeString);
        const task = Task.fromCode(codeString);
        console.log(task);
        task.run(await ctx.getCurrentTab());
        steps.length = 0;
    } else {
        steps.push(userInput);
        chat.writeUserMessage(steps[steps.length - 1]);
    }
    chat.clearInput();
});

async function sendEmailGmail(to: string, subject: string, body: string) {
    const tab = await ctx.getCurrentTab();
    await tab.navigateTo('https://mail.google.com')
    await sleep(1000);

    await tab.findElement('Compose', "click")
    await tab.clickElement()
    await sleep(1000);
   
    await tab.findElement('To input bar', "type")
    await tab.sendKeysToElement(to)
    await sleep(1000);
   
    await tab.findElement('Subject', "type")
    await tab.sendKeysToElement(subject)
    await sleep(1000);
    
    await tab.findElement('Message body', "type")
    await tab.sendKeysToElement(body)
    await sleep(1000);

    await tab.findElement('Send', "click")
    await tab.clickElement()
}

document.getElementById('exec')!.addEventListener('click', async () => {
    // const tab = await ctx.getCurrentTab();
    // await tab.findElement('chat input bar or content editable div', "type");
    // await tab.sendKeysToElement('de que va el mod', Key.ENTER);
    // const task = Task.fromCode(`
    // async function clickComposeButton() {
    //     await tab.findElement('compose button');
    //     await tab.clickElement();
    // }`);
    // console.log(task);
    // task.run(await ctx.getCurrentTab());

    // await tab.findElement('Pause button', "click");
    // await tab.clickElement();
});
