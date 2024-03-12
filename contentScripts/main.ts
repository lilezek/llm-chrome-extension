import { sendKeysToElement, clickElement } from "./interact.js";
import { getFullDOM, getTabbableVisibleElements } from "./queryDOM.js";

const smartBrowsing = {
    getFullDOM,
    getTabbableVisibleElements,
    sendKeysToElement,
    clickElement,
};

(window as any).smartBrowsing = smartBrowsing;

/**
 * These three types are used to enforce types on the extension side of the code.
 */
export type ClientsideFunctions = keyof typeof smartBrowsing;
export type ClientsideFunctionArgs<F extends ClientsideFunctions> = Parameters<typeof smartBrowsing[F]>;
export type ClientsideFunctionReturn<F extends ClientsideFunctions> = ReturnType<typeof smartBrowsing[F]>;
export default smartBrowsing;

console.log("Smart Browsing Content Script Loaded!", smartBrowsing);
