import { Tab } from "./runInExtension.js";

window.addEventListener('message', (event) => {
    const { data } = event;
    const { type, code, args } = data;
    if (type == "eval") {
        eval(code)(Tab, ...args);
    }
});