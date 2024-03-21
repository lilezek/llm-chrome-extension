import { BrowsingContent } from "./browser/chrome.js";
import chat from "./chat/chat.js";
import { ChatGPTChat } from "./AI/chatgpt.js";
import { Task } from "./tasks/task.js";
import "./tasks/built-in/barrel.js";
import { SandboxContext } from "./sandbox/context.js";

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
        const sandbox = new SandboxContext(await ctx.getCurrentTab());
        await task.run(sandbox);
        steps.length = 0;
        task.save();
    } else {
        steps.push(userInput);
        chat.writeUserMessage(steps[steps.length - 1]);
    }
    chat.clearInput();
});

document.getElementById('exec')!.addEventListener('click', async () => {
    // const tab = await ctx.getCurrentTab();
    // await tab.findElement('chat input bar or content editable div', "type");
    // await tab.sendKeysToElement('message', Key.ENTER);
    // const task = Task.fromCode(`
    // async function clickComposeButton() {
    //     await tab.findElement('compose button');
    //     await tab.clickElement();
    // }`);
    // console.log(task);
    // task.run(await ctx.getCurrentTab());

    // await tab.findElement('Pause button', "click");
    // await tab.clickElement();

    const tab = await ctx.getCurrentTab();
    const sandbox = new SandboxContext(tab);
    await sandbox.eval(`async (tab) => {
        await tab.findElement('Pause button', "click");
        await tab.clickElement();
    }`);
});
