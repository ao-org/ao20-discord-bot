import readline from 'node:readline';
import { processEvent } from './processEvent.js';
import { spawn } from 'node:child_process';
import { normalize } from './normalize.js';

export const startEventSubscription = () => {
  const ps = spawn('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    './scripts/subscribe.ps1',
  ]);

  ps.stdout.setEncoding('utf8');

  ps.stdout.on('data', (chunk) => {
    console.log(chunk);
  });

  ps.stderr.on('data', (err) => {
    console.error(err.toString());
  });

  ps.on('exit', (code) => {
    console.log(`PowerShell exited: ${code}`);
  });

  const rl = readline.createInterface({
    input: ps.stdout!,
  });

  rl.on('line', (line) => {
    const raw = JSON.parse(line);

    processEvent(normalize(raw) as any);
  });

  return ps;
};
