import { RawEvent } from '../types/rawEvent.js';
import type { WindowsEvent } from '../types/windows-event.js';

export const normalize = (raw: RawEvent): WindowsEvent => ({
  id: raw.Id,
  log: raw.LogName,
  provider: raw.ProviderName,
  level: raw.LevelDisplayName,
  timestamp: new Date(raw.TimeCreated),
  message: raw.Message,
});
