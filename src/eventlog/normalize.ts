import { RawEvent } from '../events/rawEvent.js';
import type { WindowsEvent } from '../types/windows-event.js';

export const normalize = (raw: RawEvent): WindowsEvent => ({
  id: raw.recordId,
  provider: raw.provider,
  level: String(raw.level) as WindowsEvent['level'],
  log: raw.logName,
  message: raw.message,
  timestamp: raw.timestamp,
});
