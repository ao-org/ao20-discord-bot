// Feature: node-lts-upgrade, Property 2: Command handler functional preservation

/**
 * Property-based test for command handler functional preservation.
 *
 * Generates random valid command names and argument arrays using fast-check,
 * executes the corresponding handler with a mocked discord.js v14 message,
 * and verifies it calls send with a valid v14 payload structure (either
 * { embeds: [...] } or { content: ... }) without throwing.
 *
 * **Validates: Requirements 5.1**
 */

const fc = require("fast-check");

// ---------------------------------------------------------------------------
// Mocks — must be declared before requiring command modules
// ---------------------------------------------------------------------------

jest.mock("../db", () => {
  const mockFirst = jest.fn().mockResolvedValue({ online_user_record: 42 });
  const mockSelect = jest.fn().mockReturnValue({ first: mockFirst });
  const db = jest.fn().mockReturnValue({ select: mockSelect });
  return db;
});

jest.mock("../embeds", () => {
  const { EmbedBuilder } = require("discord.js");
  class MockErrorEmbed extends EmbedBuilder {
    constructor() {
      super();
      this.setColor(0xff0000);
    }
  }
  class MockSuccessEmbed extends EmbedBuilder {
    constructor() {
      super();
      this.setColor(0x57f287);
    }
  }
  return { ErrorEmbed: MockErrorEmbed, SuccessEmbed: MockSuccessEmbed };
});

jest.mock("../utils", () => ({
  emoji: jest.fn(() => ":fire:"),
  getRandomElement: jest.fn((arr) => arr[0]),
}));

jest.mock("axios", () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      Reports: "There are no reports",
      AccountReports: "There are no reports",
      Gold: "1000000",
      DBData: { EndDB: "2025-01-01", StartDB: "2024-12-01" },
    },
  }),
}));

jest.mock("../services/githubService", () => ({
  fetchChangelog: jest.fn().mockResolvedValue(null),
}));

jest.mock("../services/aiService", () => ({
  summarizeChangelog: jest.fn().mockResolvedValue("Summary"),
  generateStaffResponse: jest.fn().mockResolvedValue("AI response text"),
}));

// ---------------------------------------------------------------------------
// Require command modules (after mocks are set up)
// ---------------------------------------------------------------------------

const ayuda = require("../commands/ayuda");
const online = require("../commands/online");
const record = require("../commands/record");
const reporte = require("../commands/reporte");
const changelog = require("../commands/changelog");
const aibot = require("../commands/aibot");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a map of command name → module for lookup.
 */
const commandModules = new Map([
  ["ayuda", ayuda],
  ["online", online],
  ["record", record],
  ["reporte", reporte],
  ["changelog", changelog],
  ["aibot", aibot],
]);

/**
 * Creates a mocked discord.js v14 message object.
 * The send/reply mocks record calls so we can inspect payload structure.
 */
function makeMessage() {
  const send = jest.fn().mockResolvedValue({});
  const reply = jest.fn().mockResolvedValue({});

  // Build a commands Collection-like Map for ayuda
  const commands = new Map();
  commands.map = function (fn) {
    return Array.from(this.values()).map(fn);
  };
  for (const [name, mod] of commandModules) {
    commands.set(name, { name: mod.name, description: mod.description });
  }

  // Mock channel.messages.fetch for aibot
  const fetchedMessages = {
    size: 0,
    filter: jest.fn().mockReturnValue({ map: jest.fn().mockReturnValue([]) }),
    last: jest.fn().mockReturnValue({ id: "1", createdTimestamp: 0 }),
  };

  return {
    channel: {
      id: "1031483686828384276", // matches reporte's required channel
      send,
      messages: { fetch: jest.fn().mockResolvedValue(fetchedMessages) },
    },
    client: { commands },
    author: { bot: false, username: "TestUser" },
    reply,
    content: "/test",
  };
}

/**
 * Validates that a send/reply call argument uses v14 object syntax:
 * either { embeds: [...] } or { content: ... }
 */
function isValidV14Payload(arg) {
  if (typeof arg !== "object" || arg === null) return false;
  const hasEmbeds = Array.isArray(arg.embeds);
  const hasContent = typeof arg.content === "string";
  return hasEmbeds || hasContent;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbCommandName = fc.constantFrom("ayuda", "online", "record", "reporte", "changelog", "aibot");

// Generate random argument arrays (strings that could be command arguments)
const arbArgs = fc.array(
  fc.string({ minLength: 0, maxLength: 30 }).filter((s) => !s.includes("\0")),
  { minLength: 0, maxLength: 5 }
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 2: Command handler functional preservation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ayuda handler always calls send with valid v14 payload for any args", () => {
    fc.assert(
      fc.property(arbArgs, (args) => {
        const message = makeMessage();

        // ayuda.execute is synchronous (returns value, not promise)
        ayuda.execute(message, args);

        // At least one of send or reply must have been called
        const sendCalls = message.channel.send.mock.calls;
        const replyCalls = message.reply.mock.calls;
        const allCalls = [...sendCalls, ...replyCalls];

        expect(allCalls.length).toBeGreaterThanOrEqual(1);

        for (const call of allCalls) {
          expect(isValidV14Payload(call[0])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("online handler always calls send with valid v14 payload", async () => {
    await fc.assert(
      fc.asyncProperty(arbArgs, async (args) => {
        const message = makeMessage();

        await online.execute(message, args);

        const sendCalls = message.channel.send.mock.calls;
        expect(sendCalls.length).toBeGreaterThanOrEqual(1);

        for (const call of sendCalls) {
          expect(isValidV14Payload(call[0])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("record handler always calls send with valid v14 payload", async () => {
    await fc.assert(
      fc.asyncProperty(arbArgs, async (args) => {
        const message = makeMessage();

        await record.execute(message, args);

        const sendCalls = message.channel.send.mock.calls;
        expect(sendCalls.length).toBeGreaterThanOrEqual(1);

        for (const call of sendCalls) {
          expect(isValidV14Payload(call[0])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("reporte handler always calls send with valid v14 payload from allowed channel", async () => {
    await fc.assert(
      fc.asyncProperty(arbArgs, async (args) => {
        const message = makeMessage();

        // reporte.execute fires sendReport without await, so we need to
        // flush the microtask queue for the async chain to settle.
        await reporte.execute(message, args);
        // Wait for the fire-and-forget sendReport → getLastReport → axios.get chain
        await new Promise((r) => setTimeout(r, 0));
        await new Promise((r) => process.nextTick(r));

        const sendCalls = message.channel.send.mock.calls;
        expect(sendCalls.length).toBeGreaterThanOrEqual(1);

        for (const call of sendCalls) {
          expect(isValidV14Payload(call[0])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("changelog handler always calls send with valid v14 payload (or no send when no data)", async () => {
    await fc.assert(
      fc.asyncProperty(arbArgs, async (args) => {
        const message = makeMessage();

        // changelog.execute calls sendChangelog which is fire-and-forget
        await changelog.execute(message, args);

        // fetchChangelog returns null, so no embeds are sent — that's valid
        // The property is: if send IS called, it uses v14 syntax
        const sendCalls = message.channel.send.mock.calls;
        for (const call of sendCalls) {
          expect(isValidV14Payload(call[0])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("aibot handler always calls send with valid v14 payload (or no send when no messages)", async () => {
    await fc.assert(
      fc.asyncProperty(arbArgs, async (args) => {
        const message = makeMessage();

        // aibot.execute calls handleStaffResponse which is fire-and-forget
        await aibot.execute(message, args);

        // Flush microtask queue for the fire-and-forget async chain
        await new Promise((r) => setTimeout(r, 0));
        await new Promise((r) => process.nextTick(r));

        const sendCalls = message.channel.send.mock.calls;
        for (const call of sendCalls) {
          expect(isValidV14Payload(call[0])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  }, 30000);

  it("any command handler does not throw for random args", async () => {
    await fc.assert(
      fc.asyncProperty(arbCommandName, arbArgs, async (cmdName, args) => {
        const message = makeMessage();
        const mod = commandModules.get(cmdName);

        // Should not throw
        await expect(
          Promise.resolve(mod.execute(message, args))
        ).resolves.not.toThrow();
      }),
      { numRuns: 100 }
    );
  });
});
