export interface Request {
    action: string;
}

export interface Response<T> {
    data: T;
}

type OnMessageReturnType = {
    __chrome_events_onMessage: never;
} & boolean;

// From https://developer.chrome.com/docs/extensions/develop/concepts/messaging
// If you use callbacks, the sendResponse() callback is only valid if used synchronously, 
// or if the event handler returns true to indicate that it will respond asynchronously.
export const SYNCHRONOUS = false as OnMessageReturnType;
export const ASYNCHRONOUS = true as OnMessageReturnType;

export const OnMessage = chrome.runtime.onMessage as chrome.events.Event<
    (msg: Request, sender: chrome.runtime.MessageSender, sendResponse: (response: Response<unknown>) => void) => OnMessageReturnType | undefined
>;