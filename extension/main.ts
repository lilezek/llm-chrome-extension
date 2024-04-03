import { ChromeBrowsingContext } from "./browser/chrome.js";
import chat from "./chat/chat.js";
import { ChatGPTChat } from "./AI/chatgpt.js";
import { Task } from "./tasks/task.js";
import { SandboxContext } from "./sandbox/context.js";

// barrel files
import "./tasks/built-in/barrel.js";
import "./components/barrel.js";
import { TransformVariablesIntoGlobals } from "./tasks/parser.js";
import { debug } from "./debug.js";

const chatgpt = new ChatGPTChat(process.env.OPENAI_API_KEY!);
const ctx = new ChromeBrowsingContext(chatgpt);


chat.writeAssistantMessage('Write your task below.');
chat.startTask();
const steps: string[] = [];
const codeSteps: string[] = [];
let lastTask: Task | null;
let lastSandbox: SandboxContext | null;

chat.addEventListener('run', async (ev) => {
    const message = chat.writeAssistantMessage('Thinking...');
    lastSandbox = lastSandbox ?? new SandboxContext(await ctx.getCurrentTab());

    steps[ev.detail.index] = ev.detail.description;

    codeSteps[ev.detail.index] = await chatgpt.generateStepCode(
        steps.slice(0, ev.detail.index),
        steps[ev.detail.index],
        codeSteps.join('\n'));

    // Transform variables into globals before running the task
    const stepCode = TransformVariablesIntoGlobals(codeSteps[ev.detail.index]);
    lastTask = Task.fromCode(`function step() {${stepCode}}`);
    debug.log(stepCode);
    const exampleUsage = lastTask.findUsage(codeSteps[ev.detail.index]);
    const result = await lastTask.run(lastSandbox, ...exampleUsage);

    message.remove();

    if (typeof result === "string") {
        chat.writeAssistantMessage(result);
    }
});

chat.addEventListener('save', async () => {
    const body = steps.join('\n').trim();

    if (!body) {
        chat.writeAssistantMessage('No task to save.');
        return;
    }

    const message = chat.writeAssistantMessage('Saving task...');

    const code = `function () {${body}}`;
    const refactorCode = await chatgpt.refactorCode(code);
    const newTask = Task.fromCode(refactorCode);
    debug.log(newTask);
    newTask.save();

    message.remove();
    chat.writeAssistantMessage(`New task saved successfully: ${newTask.name}`);
});

document.getElementById('exec')!.addEventListener('click', async () => {
    // const task = Task.fromCode(`
    // async function task() {
    //     await tab.navigateTo('https://mail.google.com');

    //     await tab.findElement('Settings', 'click');
    //     await tab.clickElement();

    //     await tab.findElement('See all settings', 'click');
    //     await tab.clickElement();

    //     await tab.findElement('Language', 'select');
    // }`);
    // const sandbox = new SandboxContext(await ctx.getCurrentTab());
    // task.run(sandbox);

    // const task = Task.fromCode(`
    // async function task() {
    //     sendEmailGmail(tab, "devezek@gmail.com", "test subject", "test body");
    // }`);
    // const sandbox = new SandboxContext(await ctx.getCurrentTab());
    // task.run(sandbox);

    // // await tab.findElement('Pause button', "click");
    // // await tab.clickElement();

    // const tab = await ctx.getCurrentTab();
    // await tab.navigateTo("https://www.horoscope.com/");

    // const scorpioElement = await tab.findElement("Scorpio", "select");
    // await tab.clickElement(scorpioElement);

    // await tab.findInText("Today's Horoscope");

    // const code = `async function findRoleOnLinkedIn(tab, name) {
    //     // 1. Navigate to LinkedIn
    //     await tab.navigateTo('https://www.linkedin.com');

    //     // 2. Find and type in the search bar
    //     const searchBar = await tab.findElement('search bar', 'type');
    //     await tab.sendKeysToElement(searchBar, name, Key.ENTER);

    //     // 3. Click on the profile
    //     const profileLink = await tab.findElement('Parishkrit Giri', 'click');
    //     await tab.clickElement(profileLink);

    //     // 4. Find and extract the current role
    //     const currentRole = await tab.findInText('Current');
    //     return currentRole;
    // }

    // // Call the function with the name of the person you are looking for
    // findRoleOnLinkedIn(tab, 'Parishkrit Giri').then(role => {
    //     console.log('Parishkrit Giri\\'s current role is:', role);
    // }).catch(err => {
    //     console.error('An error occurred:', err);
    // });`;

    // const task = Task.fromCode(code);
    // const exampleUsage = task.findUsage(code);

    // const sandbox = new SandboxContext(await ctx.getCurrentTab());
    // debug.log(await task.run(sandbox, ...exampleUsage));

    console.log(TransformVariablesIntoGlobals(`
    // 1. Navigate to LinkedIn
    await tab.navigateTo('https://www.linkedin.com');

    // 2. Find and type in the search bar
    const searchBar = await tab.findElement('search bar', 'type');
    await tab.sendKeysToElement(searchBar, name, Key.ENTER);

    // 3. Click on the profile
    const profileLink = await tab.findElement('Parishkrit Giri', 'click');
    await tab.clickElement(profileLink);

    // 4. Find and extract the current role
    const currentRole = await tab.findInText('Current');`));
});
