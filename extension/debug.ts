export const debug = {
    log(...args: any[]) {
        if (DEBUG) {
            console.log(...args);
        }
    }
};