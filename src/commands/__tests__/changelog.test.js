/**
 * @file Tests for src/commands/changelog.js
 * @see requirements.md Requirement 8
 */

// 1. jest.mock() calls — must come before require()
jest.mock("../../services/githubService");
jest.mock("../../services/aiService");
jest.mock("../../embeds", () => {
  const mockEmbed = () => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setURL: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
  });
  return { SuccessEmbed: jest.fn(mockEmbed), ErrorEmbed: jest.fn(mockEmbed) };
});

// 2. require module under test + mocked deps
const changelog = require("../changelog");
const { execute } = changelog;
const { fetchChangelog } = require("../../services/githubService");
const { summarizeChangelog } = require("../../services/aiService");
const { SuccessEmbed } = require("../../embeds");
const fc = require("fast-check");

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

function makeChangelogData(repoName) {
  return {
    repoName,
    previousTag: "v1.0.0",
    latestTag: "v1.1.0",
    previousTagDate: "2024-01-01T00:00:00Z",
    latestTagDate: "2024-02-01T00:00:00Z",
    commitMessages: "- fix bug\n- add feature",
  };
}

// ─────────────────────────────────────────────────────────────

describe("sendChangelog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchChangelog.mockResolvedValue(makeChangelogData("test-repo"));
    summarizeChangelog.mockResolvedValue("Summary text");
  });

  /** @requirement 8.2 */
  it("should send 3 embeds when all repositories return changelog data", async () => {
    const message = makeMessage();

    await execute(message, []);
    await new Promise(setImmediate);

    expect(SuccessEmbed).toHaveBeenCalledTimes(3);
    expect(message.channel.send).toHaveBeenCalledTimes(3);
  });

  /** @requirement 8.3 */
  it("should skip repos where fetchChangelog returns null", async () => {
    fetchChangelog
      .mockResolvedValueOnce(makeChangelogData("assets"))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeChangelogData("client"));

    const message = makeMessage();

    await execute(message, []);
    await new Promise(setImmediate);

    expect(SuccessEmbed).toHaveBeenCalledTimes(2);
    expect(message.channel.send).toHaveBeenCalledTimes(2);
  });

  /** @requirement 8.4 */
  it("should call fetchChangelog once per repository", async () => {
    const message = makeMessage();

    await execute(message, []);
    await new Promise(setImmediate);

    expect(fetchChangelog).toHaveBeenCalledTimes(3);
    expect(fetchChangelog).toHaveBeenCalledWith("ao-org/argentum-online-assets");
    expect(fetchChangelog).toHaveBeenCalledWith("ao-org/argentum-online-server");
    expect(fetchChangelog).toHaveBeenCalledWith("ao-org/argentum-online-client");
  });

  /** @requirement 8.5 */
  it("should call summarizeChangelog with the commit messages from each changelog", async () => {
    const message = makeMessage();

    await execute(message, []);
    await new Promise(setImmediate);

    expect(summarizeChangelog).toHaveBeenCalledTimes(3);
    expect(summarizeChangelog).toHaveBeenCalledWith("- fix bug\n- add feature");
  });

  /** Feature: controller-unit-tests, Property 8: Changelog skips repos with null changelog */
  /** Validates: Requirements 8.3 */
  it("should send exactly K embeds when K of 3 repos return non-null changelog (property)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 3, maxLength: 3 }),
        async (flags) => {
          jest.clearAllMocks();
          flags.forEach((hasData, i) => {
            if (hasData) {
              fetchChangelog.mockResolvedValueOnce(makeChangelogData(`repo-${i}`));
            } else {
              fetchChangelog.mockResolvedValueOnce(null);
            }
          });
          summarizeChangelog.mockResolvedValue("Summary");

          const message = makeMessage();
          await execute(message, []);
          await new Promise(setImmediate);

          const expectedCount = flags.filter(Boolean).length;
          expect(message.channel.send).toHaveBeenCalledTimes(expectedCount);
        }
      )
    );
  });
});

// ─────────────────────────────────────────────────────────────

describe("execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchChangelog.mockResolvedValue(makeChangelogData("test-repo"));
    summarizeChangelog.mockResolvedValue("Summary text");
  });

  /** @requirement 8.6 */
  it("should call sendChangelog with message.channel", async () => {
    const message = makeMessage();

    await execute(message, []);
    await new Promise(setImmediate);

    // sendChangelog is internal, so we verify its effects: fetchChangelog was called
    // and channel.send was invoked on the correct channel object
    expect(fetchChangelog).toHaveBeenCalled();
    expect(message.channel.send).toHaveBeenCalled();
  });
});
