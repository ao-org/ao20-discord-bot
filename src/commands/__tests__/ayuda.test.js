/**
 * @file Tests for src/commands/ayuda.js
 * @see requirements.md Requirement 4
 */

const fc = require("fast-check");
const ayuda = require("../ayuda");
const { execute } = ayuda;

// ─────────────────────────────────────────────────────────────

function makeMessage(overrides = {}) {
  const commands = new Map();
  // Add a map method that works like Discord Collection.map (iterates values)
  commands.map = function (fn) {
    return Array.from(this.values()).map(fn);
  };
  return {
    channel: { send: jest.fn().mockResolvedValue({}), ...overrides.channel },
    client: { commands, ...overrides.client },
    reply: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────

describe("module exports", () => {
  /** @requirement 4.5 */
  it('should export name equal to "ayuda"', () => {
    expect(ayuda.name).toBe("ayuda");
  });

  /** @requirement 4.5 */
  it("should export a description string", () => {
    expect(typeof ayuda.description).toBe("string");
    expect(ayuda.description.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────

describe("execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 4.2 */
  it("should list all commands when called with no arguments", async () => {
    const commands = new Map();
    commands.map = function (fn) {
      return Array.from(this.values()).map(fn);
    };
    commands.set("ayuda", { name: "ayuda", description: "Help command" });
    commands.set("online", { name: "online", description: "Online command" });

    const message = makeMessage({ client: { commands } });

    await execute(message, []);

    expect(message.channel.send).toHaveBeenCalledTimes(1);
    const sentData = message.channel.send.mock.calls[0][0];
    expect(sentData).toHaveProperty("content");
    expect(typeof sentData.content).toBe("string");
    expect(sentData.content).toContain("/ayuda");
    expect(sentData.content).toContain("/online");
  });

  /** @requirement 4.3 */
  it("should show name and description for a valid command", async () => {
    const commands = new Map();
    commands.map = function (fn) {
      return Array.from(this.values()).map(fn);
    };
    commands.set("ayuda", { name: "ayuda", description: "Help command" });

    const message = makeMessage({ client: { commands } });

    await execute(message, ["ayuda"]);

    expect(message.channel.send).toHaveBeenCalledTimes(1);
    const sentData = message.channel.send.mock.calls[0][0];
    expect(sentData).toHaveProperty("content");
    expect(sentData.content).toContain("ayuda");
    expect(sentData.content).toContain("Help command");
  });

  /** @requirement 4.4 */
  it("should reply with error for an invalid command", async () => {
    const message = makeMessage();

    await execute(message, ["nonexistent"]);

    expect(message.reply).toHaveBeenCalledTimes(1);
    expect(message.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("nonexistent") })
    );
    expect(message.channel.send).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────
  // Property-based tests (fast-check)
  // ─────────────────────────────────────────────────────────────

  /** Feature: controller-unit-tests, Property 2: Ayuda lists all commands when no args given
   *  Validates: Requirements 4.2
   */
  it("should list every command name in output for any set of commands", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z]+$/.test(s)),
          { minLength: 1, maxLength: 5 }
        ),
        (names) => {
          const commands = new Map();
          commands.map = function (fn) {
            return Array.from(this.values()).map(fn);
          };
          names.forEach((n) => commands.set(n, { name: n, description: `desc-${n}` }));

          const message = makeMessage({ client: { commands } });
          execute(message, []);

          expect(message.channel.send).toHaveBeenCalledTimes(1);
          const sentData = message.channel.send.mock.calls[0][0];
          expect(sentData).toHaveProperty("content");
          names.forEach((n) => {
            expect(sentData.content).toContain(n);
          });
        }
      )
    );
  });

  /** Feature: controller-unit-tests, Property 3: Ayuda returns name and description for valid command
   *  Validates: Requirements 4.3
   */
  it("should return name and description for any valid command", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (name, description) => {
          const commands = new Map();
          commands.map = function (fn) {
            return Array.from(this.values()).map(fn);
          };
          commands.set(name, { name, description });

          const message = makeMessage({ client: { commands } });
          execute(message, [name]);

          expect(message.channel.send).toHaveBeenCalledTimes(1);
          const sentData = message.channel.send.mock.calls[0][0];
          expect(sentData).toHaveProperty("content");
          expect(sentData.content).toContain(name);
          expect(sentData.content).toContain(description);
        }
      )
    );
  });

  /** Feature: controller-unit-tests, Property 4: Ayuda rejects invalid command names
   *  Validates: Requirements 4.4
   */
  it("should call message.reply for any command name not in the map", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        (invalidName) => {
          const commands = new Map();
          commands.map = function (fn) {
            return Array.from(this.values()).map(fn);
          };
          // Ensure the generated name is NOT in the map
          // Map is empty, so any name is invalid

          const message = makeMessage({ client: { commands } });
          execute(message, [invalidName]);

          expect(message.reply).toHaveBeenCalledTimes(1);
          expect(message.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining(invalidName) })
          );
          expect(message.channel.send).not.toHaveBeenCalled();
        }
      )
    );
  });
});
