class Chat {
    constructor(private chatElement: HTMLTextAreaElement, private inputElement: HTMLInputElement) {}

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
export default new Chat(chatElement, inputElement);