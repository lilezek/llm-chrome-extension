import { SelectOneElement, Selector, sleep } from "./utils.js";


export function clickElement(selector: Selector) {
    const el = SelectOneElement(selector);
    if (el) {
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

export const KeyCodes = {
    Enter: 13,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
};

// The inverse of the KeyCodes object
const Codes = Object.entries(KeyCodes).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {} as Record<number, string>);


/**
 * Simulates keypress, keydown, and keyup events on an element
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

    const kUp = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        // view: window,
        keyCode,
        which: keyCode,
        key,
    });
    el.dispatchEvent(kUp);
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
                if ('value' in el && typeof el.value === "string") {
                    el.value = el.value + key;
                    await sleep(key.length * 100);         
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