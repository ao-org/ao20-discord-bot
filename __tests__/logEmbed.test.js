import { createLogEmbed } from '../dist/services/logEmbed.js';

describe('createLogEmbed', () => {
  test('creates a decorated embed with the original log and summary', () => {
    const embed = createLogEmbed(
      'Performance.log',
      { itemid: '46595', clock: '1700000000', value: '13 - [Performance.log] slow' },
      'Operación lenta',
    ).toJSON();

    expect(embed.title).toBe('Argentum 20 · Performance.log');
    expect(embed.description).toContain('[Performance.log] slow');
    expect(embed.footer.text).toContain('46595');
    expect(embed.fields[0].name).toBe('Resumen IA');
    expect(embed.fields[0].value).toBe('Operación lenta');
  });
});
