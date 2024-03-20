type ClassWithJsonStatic<T> = { fromJSON(json: any): T; };

export abstract class Storage {
    constructor(protected key: string) {}

    abstract get(): string | null;
    abstract set(value: string): void;

    getKey() {
        return this.key;
    }

    getJSON<T>(class_: ClassWithJsonStatic<T>): T | null {
        const jsonString = this.get();
        if (jsonString === null) {
            return null;
        }
        try {
            const json = JSON.parse(jsonString);
            return class_.fromJSON(json);
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    setJSON<T>(value: T): void {
        this.set(JSON.stringify(value));
    }
}