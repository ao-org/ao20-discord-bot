import { classifyLog } from '../dist/services/logClassifier.js';

describe('classifyLog', () => {
  test.each([
    ['1 - [Database.log] query failed', 'Database.Log'],
    ['1 - [Cheating.log] suspicious client', 'Cheating.Log'],
    ['0 - [Subastas.log] auction started', 'Subastas.Log'],
    ['1 - [Bans] player banned', 'Bans.log'],
    ['2 - [MonetizationCreditosPatreon.log] credits', 'MonetizationCreditosPatreon.log'],
    ['3 - [MonetizationShopTransactions.log] purchase', 'MonetizationShopTransactions.log'],
    ['4 - [MonetizationShopErrors.log] failed', 'MonetizationShopErrors.log'],
    ['5 - [EdicionPaquete.log] package edited', 'EdicionPaquete.log'],
    ['6 - [Info] server info', 'MacroServidor.log'],
    ['6 - [MacroServidor] server macro', 'MacroServidor.log'],
    ['7 - [MacroCliente] client macro', 'MacroCliente.log'],
    ['8 - [Propiedades] property sold', 'Propiedades.log'],
    ['9 - [Eventos.log] event warning', 'Eventos.log'],
    ['10 - [EjercitoReal.log] army', 'EjercitoReal.Log'],
    ['11 - [EjercitoCaos.log] army', 'EjercitoCaos.Log'],
    ['12 - [Errores.log] error', 'Errores.log'],
    ['13 - [Performance.log] slow operation', 'Performance.log'],
    ['14 - [obtenemos.log] query', 'obtenemos.log'],
    ['15 - [Clans.log] clan update', 'Clans.log'],
    ['16 - [Haracin] /IRA argeliot', 'GM.log'],
    ['17 - Item: Espada (3) Cantidad: 1', 'Premios.log'],
    ['18 - [Database.log] database error', 'Database.Log'],
    ['19 - [Cheating.log] security event', 'Cheating.Log'],
    ['20 - [BankTransfers.log] transfer', 'BankTransfers.log'],
    ['5 - Error number: 5 | Description: failure', 'Errores.log'],
    ['0 - Starting the server 14/08/2026 16:57:23', 'MacroServidor.log'],
    ['0 - Stopping the server', 'MacroServidor.log'],
    ['1 - Server restarted', 'MacroServidor.log'],
  ])('%s -> %s', (value, expected) => {
    expect(classifyLog(value)).toBe(expected);
  });

  test('returns undefined for an unknown event', () => {
    expect(classifyLog('16 - [Haracin] without a known format')).toBe('GM.log');
    expect(classifyLog('server started')).toBeUndefined();
  });
});
