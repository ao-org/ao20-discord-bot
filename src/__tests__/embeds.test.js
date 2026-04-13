/**
 * @file Tests for src/embeds.js
 * @see requirements.md Requirement 3
 */

const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed, SuccessEmbed } = require("../embeds");

// ─────────────────────────────────────────────────────────────

describe("ErrorEmbed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 3.2 */
  it("should have color set to RED (0xFF0000)", () => {
    const embed = new ErrorEmbed();
    expect(embed.data.color).toBe(0xFF0000);
  });

  /** @requirement 3.4 */
  it("should be an instance of EmbedBuilder", () => {
    const embed = new ErrorEmbed();
    expect(embed).toBeInstanceOf(EmbedBuilder);
  });
});

// ─────────────────────────────────────────────────────────────

describe("SuccessEmbed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 3.3 */
  it("should have color set to GREEN (0x57F287)", () => {
    const embed = new SuccessEmbed();
    expect(embed.data.color).toBe(0x57F287);
  });

  /** @requirement 3.5 */
  it("should be an instance of EmbedBuilder", () => {
    const embed = new SuccessEmbed();
    expect(embed).toBeInstanceOf(EmbedBuilder);
  });
});
