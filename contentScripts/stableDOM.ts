import { debug } from "./debug.js";

const STABLE_DOM_CHECK_INTERVAL = 500;

async function waitForStableDOM(timeout: number = 10000) {
    // Heuristic: get the source of the page, wait for a while, then get the source again. Check for 
    // increase in length of the source. If the length increases more than 1%, the page is still loading.
    let sourceBefore = document.documentElement.outerHTML;
    return new Promise<boolean>((resolve) => {
        let timeRemaining = timeout;
        const interval = setInterval(() => {
            debug.log("Checking for stable DOM");
            const sourceAfter = document.documentElement.outerHTML;
            debug.log("Diff: ", sourceAfter.length - sourceBefore.length, sourceAfter.length / sourceBefore.length);
            if (sourceAfter.length / sourceBefore.length < 1.01 &&
                sourceBefore.length / sourceAfter.length < 1.01) {
                debug.log("DOM is stable");
                clearInterval(interval);
                resolve(true);
            }
            sourceBefore = sourceAfter;
            // TODO: replace for a better implementation using Date or performance.now()
            timeRemaining -= STABLE_DOM_CHECK_INTERVAL;
            if (timeRemaining <= 0) {
                debug.log("Timeout waiting for stable DOM");
                clearInterval(interval);
                resolve(false);
            }
        }, STABLE_DOM_CHECK_INTERVAL);
    });
}

export function isDOMStable() {
    return domIsStable;
}

export function setDOMDirty() {
    if (domIsStable) {
        domIsStable = false;
        waitForStableDOM().then(() => {
            domIsStable = true;
        });
    }
}

let domIsStable = true;
setDOMDirty();