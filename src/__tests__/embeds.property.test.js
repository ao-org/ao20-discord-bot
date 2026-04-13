// Feature: node-lts-upgrade, Property 3: Embed construction produces valid Discord API payloads

/**
 * Property-based test for embed construction.
 *
 * Generates random embed configurations (titles, descriptions, fields)
 * using fast-check, constructs ErrorEmbed/SuccessEmbed instances, and
 * verifies .toJSON() always produces an object with a numeric color
 * and valid structure.
 *
 * **Validates: Requirements 2.3, 2.4**
 */

const fc = require("fast-check");
const { ErrorEmbed, SuccessEmbed } = require("../embeds");

// Arbitrary for a non-empty unicode string (suitable for embed text fields)
const arbTitle = fc.string({ minLength: 1, maxLength: 256 });
const arbDescription = fc.string({ minLength: 1, maxLength: 4096 });

// Discord embed fields: name (1-256 chars), value (1-1024 chars), inline optional
const arbField = fc.record({
  name: fc.string({ minLength: 1, maxLength: 256 }),
  value: fc.string({ minLength: 1, maxLength: 1024 }),
  inline: fc.boolean(),
});

// Up to 25 fields per embed (Discord API limit)
const arbFields = fc.array(arbField, { minLength: 0, maxLength: 25 });

// Embed configuration: optional title, description, and fields
const arbEmbedConfig = fc.record({
  title: fc.option(arbTitle, { nil: undefined }),
  description: fc.option(arbDescription, { nil: undefined }),
  fields: arbFields,
});

describe("Property 3: Embed construction produces valid Discord API payloads", () => {
  it("ErrorEmbed .toJSON() always has numeric color and valid structure", () => {
    fc.assert(
      fc.property(arbEmbedConfig, (config) => {
        const embed = new ErrorEmbed();

        if (config.title !== undefined) embed.setTitle(config.title);
        if (config.description !== undefined) embed.setDescription(config.description);
        if (config.fields.length > 0) embed.addFields(...config.fields);

        const json = embed.toJSON();

        // Color must be a number
        expect(typeof json.color).toBe("number");
        // ErrorEmbed color is 0xFF0000
        expect(json.color).toBe(0xff0000);

        // Title, description, fields should match what was set
        if (config.title !== undefined) {
          expect(json.title).toBe(config.title);
        }
        if (config.description !== undefined) {
          expect(json.description).toBe(config.description);
        }
        if (config.fields.length > 0) {
          expect(json.fields).toHaveLength(config.fields.length);
          for (let i = 0; i < config.fields.length; i++) {
            expect(json.fields[i].name).toBe(config.fields[i].name);
            expect(json.fields[i].value).toBe(config.fields[i].value);
          }
        }

        // The JSON must be a plain object (serializable)
        expect(typeof json).toBe("object");
        expect(json).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("SuccessEmbed .toJSON() always has numeric color and valid structure", () => {
    fc.assert(
      fc.property(arbEmbedConfig, (config) => {
        const embed = new SuccessEmbed();

        if (config.title !== undefined) embed.setTitle(config.title);
        if (config.description !== undefined) embed.setDescription(config.description);
        if (config.fields.length > 0) embed.addFields(...config.fields);

        const json = embed.toJSON();

        // Color must be a number
        expect(typeof json.color).toBe("number");
        // SuccessEmbed color is 0x57F287
        expect(json.color).toBe(0x57f287);

        // Title, description, fields should match what was set
        if (config.title !== undefined) {
          expect(json.title).toBe(config.title);
        }
        if (config.description !== undefined) {
          expect(json.description).toBe(config.description);
        }
        if (config.fields.length > 0) {
          expect(json.fields).toHaveLength(config.fields.length);
          for (let i = 0; i < config.fields.length; i++) {
            expect(json.fields[i].name).toBe(config.fields[i].name);
            expect(json.fields[i].value).toBe(config.fields[i].value);
          }
        }

        // The JSON must be a plain object (serializable)
        expect(typeof json).toBe("object");
        expect(json).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
