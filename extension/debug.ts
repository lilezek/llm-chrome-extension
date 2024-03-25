export const debug = {
    log(...args: unknown[]) {
        if (DEBUG) {
            console.log(...args);
        }
    }
};