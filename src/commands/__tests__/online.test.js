/**
 * @file Tests for src/commands/online.js
 * @see requirements.md Requirement 5
 */

// 1. jest.mock() calls — must come before require()
jest.mock("../../db");
jest.mock("../../embeds", () => {
  const mockEmbed = () => {
    const embed = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
      setURL: jest.fn().mockReturnThis(),
      addFields: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
      setFooter: jest.fn().mockReturnThis(),
    };
    return embed;
  };
  return {
    SuccessEmbed: jest.fn(mockEmbed),
    ErrorEmbed: jest.fn(mockEmbed),
  };
});
jest.mock("../../utils", () => ({
  emoji: jest.fn(() => ":fire:"),
  getRandomElement: jest.fn(),
}));

// 2. require module under test + mocked deps
const online = require("../online");
const { execute } = online;
const db = require("../../db");
const { SuccessEmbed } = require("../../embeds");

// ─────────────────────────────────────────────────────────────

function makeMessage(overrides = {}) {
  return {
    channel: { id: "123", send: jest.fn().mockResolvedValue({}), ...overrides.channel },
    client: { commands: new Map(), ...overrides.client },
    content: "",
    author: { bot: false, username: "TestUser", ...overrides.author },
    reply: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────

describe("module exports", () => {
  /** @requirement 5.3 */
  it('should export name equal to "online"', () => {
    expect(online.name).toBe("online");
  });

  /** @requirement 5.3 */
  it("should export a description string", () => {
    expect(typeof online.description).toBe("string");
    expect(online.description.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────

describe("execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 5.2 */
  it("should send a SuccessEmbed with deprecation text", async () => {
    const message = makeMessage();

    await execute(message, []);

    // SuccessEmbed constructor was called
    expect(SuccessEmbed).toHaveBeenCalledTimes(1);

    // channel.send was called with v14 { embeds: [...] } syntax
    expect(message.channel.send).toHaveBeenCalledTimes(1);
    const sendArg = message.channel.send.mock.calls[0][0];
    expect(sendArg).toHaveProperty("embeds");
    expect(Array.isArray(sendArg.embeds)).toBe(true);
    expect(sendArg.embeds).toHaveLength(1);

    // setTitle was called with text containing deprecation keywords
    const embedInstance = SuccessEmbed.mock.results[0].value;
    expect(embedInstance.setTitle).toHaveBeenCalledTimes(1);
    const titleArg = embedInstance.setTitle.mock.calls[0][0];
    expect(titleArg).toContain("deprecado");
    expect(titleArg).toContain("SteamDB");
  });

  /** @requirement 5.4 */
  it("should not invoke db (database query is commented out)", async () => {
    const message = makeMessage();

    await execute(message, []);

    expect(db).not.toHaveBeenCalled();
  });
});
