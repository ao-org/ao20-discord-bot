/**
 * @file Tests for src/commands/aibot.js
 * @see requirements.md Requirement 9
 */

const fc = require("fast-check");

// 1. jest.mock() calls — must come before require()
jest.mock("../../services/aiService");

// 2. require module under test + mocked deps
const { handleStaffResponse, execute } = require("../aibot");
const { generateStaffResponse } = require("../../services/aiService");

// ─────────────────────────────────────────────────────────────

function makeChannel(messages = [], overrides = {}) {
  const now = Date.now();
  const msgCollection = {
    size: messages.length,
    filter: jest.fn((fn) => {
      const filtered = messages.filter(fn);
      return {
        map: jest.fn((mapFn) => filtered.map(mapFn)),
      };
    }),
    last: jest.fn(() =>
      messages.length > 0 ? messages[messages.length - 1] : undefined
    ),
  };

  const emptyCollection = {
    size: 0,
    filter: jest.fn(() => ({ map: jest.fn(() => []) })),
    last: jest.fn(),
  };

  return {
    send: jest.fn().mockResolvedValue({}),
    messages: {
      fetch: jest.fn()
        .mockResolvedValueOnce(msgCollection)
        .mockResolvedValueOnce(emptyCollection),
    },
    ...overrides,
  };
}

function makeRecentMessage(username, content) {
  return {
    createdTimestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    author: { bot: false, username },
    content,
    id: String(Math.random()),
  };
}

// ─────────────────────────────────────────────────────────────

describe("handleStaffResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 9.2 */
  it("should pass recent messages to generateStaffResponse", async () => {
    const msgs = [
      makeRecentMessage("Alice", "Hello world"),
      makeRecentMessage("Bob", "Hi there"),
    ];
    const channel = makeChannel(msgs);
    generateStaffResponse.mockResolvedValue("AI says hi");

    await handleStaffResponse(channel);

    expect(generateStaffResponse).toHaveBeenCalledTimes(1);
    const arg = generateStaffResponse.mock.calls[0][0];
    expect(arg).toContain("Alice: Hello world");
    expect(arg).toContain("Bob: Hi there");
  });

  /** @requirement 9.3 */
  it("should send fallback when no recent messages exist", async () => {
    const emptyCollection = {
      size: 0,
      filter: jest.fn(() => ({ map: jest.fn(() => []) })),
      last: jest.fn(),
    };
    const channel = {
      send: jest.fn().mockResolvedValue({}),
      messages: {
        fetch: jest.fn().mockResolvedValueOnce(emptyCollection),
      },
    };

    await handleStaffResponse(channel);

    expect(channel.send).toHaveBeenCalledWith({
      content: "No hay suficientes mensajes recientes para resumir.",
    });
    expect(generateStaffResponse).not.toHaveBeenCalled();
  });

  /** @requirement 9.4 */
  it("should send valid AI response to channel", async () => {
    const msgs = [makeRecentMessage("Alice", "test message")];
    const channel = makeChannel(msgs);
    generateStaffResponse.mockResolvedValue("This is the AI response");

    await handleStaffResponse(channel);

    expect(channel.send).toHaveBeenCalledWith({ content: "This is the AI response" });
  });

  /** @requirement 9.5 */
  it("should not send when AI returns null", async () => {
    const msgs = [makeRecentMessage("Alice", "test message")];
    const channel = makeChannel(msgs);
    generateStaffResponse.mockResolvedValue(null);

    await handleStaffResponse(channel);

    expect(channel.send).not.toHaveBeenCalled();
  });

  /** @requirement 9.5 */
  it("should not send when AI returns empty string", async () => {
    const msgs = [makeRecentMessage("Alice", "test message")];
    const channel = makeChannel(msgs);
    generateStaffResponse.mockResolvedValue("   ");

    await handleStaffResponse(channel);

    expect(channel.send).not.toHaveBeenCalled();
  });

  /** @requirement 9.6 */
  it("should send fallback error message when an error occurs", async () => {
    const channel = {
      send: jest.fn().mockResolvedValue({}),
      messages: {
        fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
      },
    };

    await handleStaffResponse(channel);

    expect(channel.send).toHaveBeenCalledWith({
      content: "No pude generar una respuesta en este momento. Inténtalo más tarde.",
    });
  });

  /** Feature: controller-unit-tests, Property 9: AI response forwarded to channel */
  /** Validates: Requirements 9.4 */
  it("should forward any non-empty AI response to channel (property)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (aiResponse) => {
          jest.clearAllMocks();
          const msgs = [makeRecentMessage("User", "hello")];
          const channel = makeChannel(msgs);
          generateStaffResponse.mockResolvedValue(aiResponse);

          await handleStaffResponse(channel);

          expect(channel.send).toHaveBeenCalledWith({ content: aiResponse });
        }
      )
    );
  });
});

// ─────────────────────────────────────────────────────────────

describe("execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 9.7 */
  it("should call handleStaffResponse with message.channel", async () => {
    const msgs = [makeRecentMessage("Alice", "hello")];
    const channel = makeChannel(msgs);
    generateStaffResponse.mockResolvedValue("response");

    const message = { channel };

    await execute(message);
    // Allow the inner handleStaffResponse promise to settle
    await new Promise(setImmediate);

    // Verify effects of handleStaffResponse: generateStaffResponse was called
    // and channel.send was invoked on the correct channel object
    expect(generateStaffResponse).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalled();
  });
});
