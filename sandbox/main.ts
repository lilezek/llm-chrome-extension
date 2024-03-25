import { Tab } from "./runInExtension.js";
import { KeyCodes } from "../contentScripts/interact.js";


declare global {
    // Global variables exposed to the sandbox.
    interface Window {
        Key: typeof KeyCodes;
    }
}

window.Key = KeyCodes;

type EvalFunction = (tab: typeof Tab, ...args: unknown[]) => void;

window.addEventListener('message', (event) => {
    const { data } = event;
    const { type, code, args } = data;
    if (type == "eval") {
        const f = eval(code) as EvalFunction;
        f.call(window, Tab, ...args);
    }
});