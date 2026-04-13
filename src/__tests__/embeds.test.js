/**
 * @file Tests for src/embeds.js
 * @see requirements.md Requirement 3
 */

const { MessageEmbed } = require("discord.js");
const { ErrorEmbed, SuccessEmbed } = require("../embeds");

// ─────────────────────────────────────────────────────────────

describe("ErrorEmbed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 3.2 */
  it("should have color set to RED", () => {
    const embed = new ErrorEmbed();
    expect(embed.color).toBe(15158332);
  });

  /** @requirement 3.4 */
  it("should be an instance of MessageEmbed", () => {
    const embed = new ErrorEmbed();
    expect(embed).toBeInstanceOf(MessageEmbed);
  });
});

// ─────────────────────────────────────────────────────────────

describe("SuccessEmbed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 3.3 */
  it("should have color set to GREEN", () => {
    const embed = new SuccessEmbed();
    expect(embed.color).toBe(3066993);
  });

  /** @requirement 3.5 */
  it("should be an instance of MessageEmbed", () => {
    const embed = new SuccessEmbed();
    expect(embed).toBeInstanceOf(MessageEmbed);
  });
});
