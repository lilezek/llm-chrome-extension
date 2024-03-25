import { TypedEventTarget } from "../TypedEventTarget.js";

class Chat extends TypedEventTarget<{
    send: CustomEvent<string>;
}>() {
    constructor(
        private chatElement: HTMLTextAreaElement, 
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
        this.chatElement.value += `User: ${msg}\n`;
    }

    writeAssistantMessage(msg: string) {
        this.chatElement.value += `Assitant: ${msg}\n`;
    }

    readInput() {
        return this.inputElement.value;
    }

    clearInput() {
        this.inputElement.value = '';
    }
}


const chatElement = document.getElementById('chat') as HTMLTextAreaElement;
const inputElement = document.getElementById('input') as HTMLInputElement;
const sendButton = document.getElementById('send') as HTMLButtonElement;
export default new Chat(chatElement, inputElement, sendButton);