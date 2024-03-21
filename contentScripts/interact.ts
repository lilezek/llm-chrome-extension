import { SelectOneElement, Selector, sleep } from "./utils.js";

export function selectOption(select: HTMLSelectElement, option: HTMLOptionElement) {
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
}

export function clickElement(selector: Selector) {
    const el = SelectOneElement(selector);
    if (el) {
        if (el instanceof HTMLOptionElement) {
            return selectOption(el.parentElement as HTMLSelectElement, el);
        }

        // Emit click, mousedown and mouseup events
        el.click();
        
        const mDown = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        el.dispatchEvent(mDown);

        const mUp = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        el.dispatchEvent(mUp);
    }
}

// TODO: Complete this list
export const KeyCodes = {
    ENTER: 13,
};

// The inverse of the KeyCodes object
const Codes = Object.entries(KeyCodes).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {} as Record<number, string>);


/**
 * Simulates keypress, keydown, beforeinput, input and keyup events on an element
 */
function simulateKeyEvents(el: HTMLElement, keyCode: number, key?: string) {
    key = key ?? Codes[keyCode];

    const kDown = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        // view: window,
        keyCode,
        which: keyCode,
        key,
    });
    el.dispatchEvent(kDown);

    const kPress = new KeyboardEvent('keypress', {
        bubbles: true,
        cancelable: true,
        // view: window,
        keyCode,
        which: keyCode,
        key,
    });
    el.dispatchEvent(kPress);

    const bInput = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        // view: window,
        data: key,
        inputType: 'insertText',
        isComposing: false,
    });
    const prevented = !el.dispatchEvent(bInput);

    if (!prevented) {
        const kInput = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            // view: window,
            data: key,
        });
        el.dispatchEvent(kInput);
    }

    const kUp = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        // view: window,
        keyCode,
        which: keyCode,
        key,
    });
    el.dispatchEvent(kUp);

    return prevented;
}

/**
 * Simulates focus on an element
 */
function simulateFocus(el: HTMLElement) {
    el.focus();

    // Dispatch mouseover
    const mOver = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    el.dispatchEvent(mOver);
}

export async function sendKeysToElement(selector: Selector, ...keys: Array<string | number>) {
    const el = SelectOneElement(selector);
    if (el) {
        el.focus();
        simulateFocus(el);
        
        for (const key of keys) {
            if (typeof key === 'string') {
                // An input or textarea element
                if ((el instanceof HTMLInputElement) || (el instanceof HTMLTextAreaElement)) {
                    el.value = el.value + key;
                    // Simulate the last character
                    simulateKeyEvents(el, key.charCodeAt(key.length-1), key[key.length-1]);
                    await sleep(key.length * 100);
                } 
                // A contenteditable element
                else if (el.isContentEditable) {
                    const prevented = simulateKeyEvents(el, key.charCodeAt(key.length - 1), key);
                    if (!prevented) {
                        el.innerText = el.innerText + key;
                    }
                    await sleep(key.length * 10);
                } else {
                    // Simulate each character
                    for (const char of key) {
                        simulateKeyEvents(el, char.charCodeAt(0), char);
                        await sleep(150);
                    }
                }
            } else {
                simulateKeyEvents(el, key);
                await sleep(300);
            }
        }
    }
}
