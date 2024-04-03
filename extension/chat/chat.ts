import { TypedEventTarget } from "../TypedEventTarget.js";
import ChatMsg from "../components/chat-msg.js";
import { ComponentType } from "../components/component.js";
import Task from "../components/task.js";

class Chat extends TypedEventTarget<{
    send: CustomEvent<string>;
    run: CustomEvent<{index: number, description: string}>;
    save: CustomEvent<never>;
}>() {
    private runningTask?: ComponentType<typeof Task>;

    constructor(
        private chatElement: HTMLDivElement, 
        private inputElement: HTMLInputElement,
        private sendButton: HTMLButtonElement,) {
        super();

        sendButton.addEventListener('click', () => {
            const message = this.readInput();
            this.clearInput();
            this.writeUserMessage(message);
            this.dispatchEvent(new CustomEvent('send', { detail: message }));
        });

        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const message = this.readInput();
                this.clearInput();
                this.writeUserMessage(message);
                this.dispatchEvent(new CustomEvent('send', { detail: message }));
            }
        });
    }

    writeUserMessage(msg: string) {
        const el = ChatMsg(msg, 'user');
        this.chatElement.append(el);
        return el;
    }

    writeAssistantMessage(msg: string) {
        const el = ChatMsg(msg, 'assistant');
        this.chatElement.append(el);
        return el;
    }

    startTask() {
        this.runningTask = Task();
        this.chatElement.append(this.runningTask);

        this.runningTask.addEventListener('run', (ev) => {
            this.dispatchEvent(new CustomEvent('run', { detail: ev.detail }));
        });

        this.runningTask.addEventListener('saveTask', () => {
            this.dispatchEvent(new CustomEvent('save'));
        });
    }

    readInput() {
        return this.inputElement.value;
    }

    clearInput() {
        this.inputElement.value = '';
    }
}


const chatElement = document.getElementById('chat') as HTMLDivElement;
const inputElement = document.getElementById('input') as HTMLInputElement;
const sendButton = document.getElementById('send') as HTMLButtonElement;
export default new Chat(chatElement, inputElement, sendButton);