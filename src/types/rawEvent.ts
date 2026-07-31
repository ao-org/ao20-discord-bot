export type RawEvent = {
  Id: number;
  LogName: string;
  ProviderName: string;
  LevelDisplayName: 'Information' | 'Warning' | 'Error' | 'Critical';
  TimeCreated: string;
  Message: string;
};
