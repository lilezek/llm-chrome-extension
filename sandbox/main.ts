import { Tab } from "./runInExtension.js";
import { KeyCodes } from "../contentScripts/interact.js";

// Expose the KeyCodes object to the window
// This is important given that the generated code will use keys such as "Key.ENTER" from the global scope.
(window as any).Key = KeyCodes;

window.addEventListener('message', (event) => {
    const { data } = event;
    const { type, code, args } = data;
    if (type == "eval") {
        const f = eval(code) as Function;
        f.call(window, Tab, ...args);
    }
});