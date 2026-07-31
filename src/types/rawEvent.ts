export type RawEvent = {
    recordId: number;
    eventId: number;
    logName: string;
    provider: string;
    level: String;
    timestamp: Date;
    message: string;
    xml: string;
};