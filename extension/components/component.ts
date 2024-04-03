import { CustomEventTarget } from "../TypedEventTarget.js";

type CustomComponentClassType<T extends unknown[], El extends HTMLElement> = {
    new(): El;
    TEMPLATE_ELEMENT: HTMLTemplateElement;
    TAG_NAME: string;
    builder(...args: T): El;
}

export function HTMLElementWithCustomEvents<Map extends {[key: string]: CustomEvent}>() {
    return HTMLElement as { new(): CustomEventTarget<Map> & HTMLElement; prototype: CustomEventTarget<Map> & HTMLElement };
}

export function defineComponent<T extends unknown[], El extends HTMLElement>(
    name: string,
    component: CustomComponentClassType<T, El>,
    options?: ElementDefinitionOptions | undefined) {
    fetch(`components/${name}.html`)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const template = doc.querySelector('template');
            if (!template) {
                throw new Error(`Template not found in component ${name}`);
            }

            component.TEMPLATE_ELEMENT = template;
            customElements.define(`sb-${name}`, component, options);
        });

    component.TAG_NAME = `sb-${name}`;

    return component.builder;
}

export type ComponentType<T extends () => HTMLElement> = ReturnType<T>;