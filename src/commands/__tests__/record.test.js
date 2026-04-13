/**
 * @file Tests for src/commands/record.js
 * @see requirements.md Requirement 6
 */

// 1. jest.mock() calls — must come before require()
jest.mock("../../db", () => jest.fn());
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
const fc = require("fast-check");
const record = require("../record");
const { execute } = record;
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

describe("execute", () => {
  let chain;

  beforeEach(() => {
    jest.clearAllMocks();
    chain = {
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ online_user_record: 150 }),
    };
    db.mockReturnValue(chain);
  });

  /** @requirement 6.2 */
  it('should call db with "service_status"', async () => {
    const message = makeMessage();

    await execute(message, []);

    expect(db).toHaveBeenCalledWith("service_status");
  });

  /** @requirement 6.3 */
  it('should chain .select("online_user_record")', async () => {
    const message = makeMessage();

    await execute(message, []);

    expect(chain.select).toHaveBeenCalledWith("online_user_record");
  });

  /** @requirement 6.4 */
  it("should chain .first()", async () => {
    const message = makeMessage();

    await execute(message, []);

    expect(chain.first).toHaveBeenCalledTimes(1);
  });

  /** @requirement 6.5 */
  it('should send a SuccessEmbed whose title contains the record value "150"', async () => {
    const message = makeMessage();

    await execute(message, []);

    expect(SuccessEmbed).toHaveBeenCalledTimes(1);
    expect(message.channel.send).toHaveBeenCalledTimes(1);

    const embedInstance = SuccessEmbed.mock.results[0].value;
    expect(embedInstance.setTitle).toHaveBeenCalledTimes(1);
    const titleArg = embedInstance.setTitle.mock.calls[0][0];
    expect(titleArg).toContain("150");
  });

  /** Feature: controller-unit-tests, Property 5: Record value flows from DB to embed title */
  /** Validates: Requirements 6.5 */
  it("should include any record value in the embed title (property)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1 }), async (recordValue) => {
        jest.clearAllMocks();
        const chain = {
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({ online_user_record: recordValue }),
        };
        db.mockReturnValue(chain);

        const message = makeMessage();
        await execute(message, []);

        const embedInstance = SuccessEmbed.mock.results[0].value;
        const titleArg = embedInstance.setTitle.mock.calls[0][0];
        expect(titleArg).toContain(String(recordValue));
      })
    );
  });
});
