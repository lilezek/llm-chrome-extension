import { defineComponent } from "./component.js";

export type Sender = 'user' | 'assistant';

export default defineComponent('chat-msg', class ChatMessage extends HTMLElement {
    public static TEMPLATE_ELEMENT: HTMLTemplateElement;
    public static TAG_NAME: string;
    
    public shadowRoot!: ShadowRoot;

    private deleteButton: HTMLButtonElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(ChatMessage.TEMPLATE_ELEMENT.content.cloneNode(true));
        this.deleteButton = this.shadowRoot.getElementById('delete') as HTMLButtonElement;

        this.deleteButton.addEventListener('click', () => {
            this.remove();
        });
    }

    static builder(content: string, sender: Sender) {
        const el = document.createElement('sb-chat-msg') as ChatMessage;
        
        const span = document.createElement('span');
        span.textContent = content;
        span.slot = 'message';
        
        el.appendChild(span);
        el.classList.add(sender);
        return el;
    }
});