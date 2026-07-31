export type WindowsEvent = {
  id: number;
  log: string;
  provider: string;
  level: 'Information' | 'Warning' | 'Error' | 'Critical';
  timestamp: Date;
  message: string;
};

export type EventHandler = (event: WindowsEvent) => void;
