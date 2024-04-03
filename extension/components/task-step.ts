import { HTMLElementWithCustomEvents, defineComponent } from "./component.js";

type customEvents = {
    run: CustomEvent<string>;
};

export default defineComponent('task-step', 
class TaskStepComponent extends HTMLElementWithCustomEvents<customEvents>() {
    public static TEMPLATE_ELEMENT: HTMLTemplateElement;
    public static TAG_NAME: string;
    
    public shadowRoot!: ShadowRoot;
    
    private runButton!: HTMLButtonElement;
    private inputElement!: HTMLDivElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(TaskStepComponent.TEMPLATE_ELEMENT.content.cloneNode(true));
        this.runButton = this.shadowRoot.getElementById('run') as HTMLButtonElement;
        this.inputElement = this.shadowRoot.getElementById('input') as HTMLDivElement;

        this.runButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('run', { detail: this.getStep() }));
        });
    }

    getStep() {
        return this.inputElement.textContent;
    }

    static builder() {
        const task = document.createElement(TaskStepComponent.TAG_NAME) as TaskStepComponent;
        return task;
    }
})