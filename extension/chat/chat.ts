class Chat {
    constructor(private chatElement: HTMLTextAreaElement) {}

    writeUserMessage(msg: string) {
        this.chatElement.value += `User: ${msg}\n`;
    }

    writeAssistantMessage(msg: string) {
        this.chatElement.value += `Assitant: ${msg}\n`;
    }
}


const chatElement = document.getElementById('chat') as HTMLTextAreaElement;
export default new Chat(chatElement);