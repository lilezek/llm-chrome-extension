import { Storage } from "./storage.js";

export class LocalStorage extends Storage {
    static * iterator() {
        for (let i = 0; i < localStorage.length; i++) {
            yield new LocalStorage(localStorage.key(i)!);
        }
    }

    static exists(key: string) {
        return localStorage.getItem(key) !== null;
    }

    get() {
        return localStorage.getItem(this.key);
    }

    set(value: string) {
        localStorage.setItem(this.key, value);
    }
}