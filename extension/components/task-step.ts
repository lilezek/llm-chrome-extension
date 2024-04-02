import { defineComponent } from "./component.js";

export default defineComponent('task-step', class TaskStepComponent extends HTMLElement {
    public static TEMPLATE_ELEMENT: HTMLTemplateElement;
    public static TAG_NAME: string;
    
    public shadowRoot!: ShadowRoot;
    
    private runButton!: HTMLButtonElement;
    private inputElement!: HTMLInputElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(TaskStepComponent.TEMPLATE_ELEMENT.content.cloneNode(true));
        this.runButton = this.shadowRoot.getElementById('run') as HTMLButtonElement;
        this.inputElement = this.shadowRoot.getElementById('input') as HTMLInputElement;

        this.runButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('run', { detail: this.inputElement.value }));
        });
    }

    getStep() {
        return this.inputElement.value;
    }

    static builder() {
        const task = document.createElement(TaskStepComponent.TAG_NAME) as TaskStepComponent;
        return task;
    }
})