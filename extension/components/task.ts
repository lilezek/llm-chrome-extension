import { HTMLElementWithCustomEvents, defineComponent } from "./component.js";
import { ComponentType } from "./component.js";
import TaskStep from "./task-step.js";

type customEvents = {
    run: CustomEvent<{ index: number, description: string }>;
    saveTask: CustomEvent<void>;
};

export default defineComponent('task',
    class TaskComponent extends HTMLElementWithCustomEvents<customEvents>() {
        public static TEMPLATE_ELEMENT: HTMLTemplateElement;
        public static TAG_NAME: string;

        public shadowRoot!: ShadowRoot;

        private steps: ComponentType<typeof TaskStep>[] = [];
        private addStepButton: HTMLButtonElement;
        private saveButton: HTMLButtonElement;

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(TaskComponent.TEMPLATE_ELEMENT.content.cloneNode(true));
            this.addStepButton = this.shadowRoot.getElementById("add-step") as HTMLButtonElement;
            this.saveButton = this.shadowRoot.getElementById("save-task") as HTMLButtonElement;

            this.addStepButton.addEventListener('click', () => {
                this.addStep();
            });

            this.saveButton.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('saveTask'));
            });

            this.addStep();
        }

        addStep() {
            const step = document.createElement('sb-task-step') as ComponentType<typeof TaskStep>;
            step.slot = 'steps';
            this.appendChild(step);
            const stepIndex = this.steps.push(step) - 1;

            step.addEventListener('run', (ev) => {
                this.dispatchEvent(new CustomEvent('run',
                    {
                        detail: {
                            description: ev.detail,
                            index: stepIndex
                        }
                    }));
            });
        }

        static builder() {
            return document.createElement(TaskComponent.TAG_NAME) as TaskComponent;
        }
    })