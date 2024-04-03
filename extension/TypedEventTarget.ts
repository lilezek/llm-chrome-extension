export interface CustomEventTarget<Map extends {[key: string]: CustomEvent}> extends EventTarget {
    addEventListener<K extends keyof Map>(
        type: K,
        listener: (ev: Map[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean
    ): void;
}

export function TypedEventTarget<Map extends {[key: string]: CustomEvent}>() {
    return EventTarget as { new(): CustomEventTarget<Map>; prototype: CustomEventTarget<Map> };
}