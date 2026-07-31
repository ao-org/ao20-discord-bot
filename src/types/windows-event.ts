export type WindowsEvent = {
    id: number;
    log: string;
    provider: string;
    level: "Information" | "Warning" | "Error" | "Critical";
    message: string;
    timestamp: Date;
};

export type EventHandler = (event: WindowsEvent) => void;

export const subscribe = (
    log: string,
    handler: EventHandler
) => {
    // Hook into EvtSubscribe or companion service.
};