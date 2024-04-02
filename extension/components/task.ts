import { defineComponent } from "./component.js";
import { ComponentType } from "./component.js";
import TaskStep from "./task-step.js";

export default defineComponent('task', class TaskComponent extends HTMLElement {
    public static TEMPLATE_ELEMENT: HTMLTemplateElement;
    public static TAG_NAME: string;

    public shadowRoot!: ShadowRoot;

    private steps: ComponentType<typeof TaskStep>[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(TaskComponent.TEMPLATE_ELEMENT.content.cloneNode(true));
        this.addStep();
        this.addStep();
        this.addStep();
    }

    addStep() {
        const step = document.createElement('sb-task-step') as ComponentType<typeof TaskStep>;
        step.slot = 'steps';
        this.appendChild(step);
        const stepIndex = this.steps.push(step) - 1;

        step.addEventListener('run', () => {
            this.dispatchEvent(new CustomEvent('run',
                {
                    detail: {
                        description: step.getStep(),
                        index: stepIndex
                    }
                }));
        });
    }

    static builder() {
        return document.createElement(TaskComponent.TAG_NAME) as TaskComponent;
    }
})