import { ChromeBrowsingContext } from "./browser/chrome.js";
import chat from "./chat/chat.js";
import { ChatGPTChat } from "./AI/chatgpt.js";
import { Task } from "./tasks/task.js";
import "./tasks/built-in/barrel.js";
import { SandboxContext } from "./sandbox/context.js";
import { debug } from "./debug.js";

const chatgpt = new ChatGPTChat(process.env.OPENAI_API_KEY!);
const ctx = new ChromeBrowsingContext(chatgpt);

chat.writeAssistantMessage('Write your task, one step at a time. Write "done" when you are finished.');
const steps: string[] = [];
let lastTask: Task | null = null;

chat.addEventListener('send', async (ev) => {
    const userInput = ev.detail
    switch (userInput.trim().toLowerCase()) {
        case 'save': {
            if (lastTask) {
                const code = await chatgpt.refactorCode(lastTask.getTypescript());
                const newTask = Task.fromCode(code);
                debug.log(newTask);
                newTask.save();
                chat.writeAssistantMessage('Task saved.');
            } else {
                chat.writeAssistantMessage('No task to save.');
            }
            break;
        }
        case 'done': {
            chat.writeAssistantMessage('Thinking...');

            const codeString = await chatgpt.generateTasks(steps);
            debug.log(codeString);
            steps.length = 0;

            lastTask = Task.fromCode(codeString);
            const sandbox = new SandboxContext(await ctx.getCurrentTab());
            await lastTask.run(sandbox);

            chat.writeAssistantMessage('Task completed. If everything went good, write "save" to save the task.');
            break;
        }
        default:
            steps.push(userInput);

    }
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
