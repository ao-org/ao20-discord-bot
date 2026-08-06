import type { LogType } from '../config.js';

const prefixes: Array<[RegExp, LogType]> = [
  [/\[Database\.log\]/i, 'Database.Log'],
  [/\[Cheating\.log\]/i, 'Cheating.Log'],
  [/\[(?:Subastas|Subasta)\.log\]/i, 'Subastas.Log'],
  [/\[Bans\]/i, 'Bans.log'],
  [/\[MonetizationCreditosPatreon\.log\]/i, 'MonetizationCreditosPatreon.log'],
  [/\[MonetizationShopTransactions\.log\]/i, 'MonetizationShopTransactions.log'],
  [/\[MonetizationShopErrors\.log\]/i, 'MonetizationShopErrors.log'],
  [/\[EdicionPaquete\.log\]/i, 'EdicionPaquete.log'],
  [/\[(?:Info|MacroServidor)\]/i, 'MacroServidor.log'],
  [/\[MacroCliente\]/i, 'MacroCliente.log'],
  [/\[Propiedades\]/i, 'Propiedades.log'],
  [/\[Eventos\.log\]/i, 'Eventos.log'],
  [/\[EjercitoReal\.log\]/i, 'EjercitoReal.Log'],
  [/\[EjercitoCaos\.log\]/i, 'EjercitoCaos.Log'],
  [/\[Errores\.log\]/i, 'Errores.log'],
  [/\[Performance\.log\]/i, 'Performance.log'],
  [/\[obtenemos\.log\]/i, 'obtenemos.log'],
  [/\[Clans\.log\]/i, 'Clans.log'],
  [/\[BankTransfers\.log\]/i, 'BankTransfers.log'],
  [/^\s*\d+\s*-\s*Item:/i, 'Premios.log'],
  [/^\s*\d+\s*-\s*Error number:/i, 'Errores.log'],
  // LogGM writes: "errorNumber - [GMName] message" without a filename.
  [/^\s*\d+\s*-\s*\[[^\]]+\]/i, 'GM.log'],
];

export function classifyLog(value: string): LogType | undefined {
  return prefixes.find(([pattern]) => pattern.test(value))?.[1];
}
