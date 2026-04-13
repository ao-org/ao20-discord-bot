/**
 * @file Tests for src/services/aiService.js
 * @see requirements.md Requirement 10
 */

const fc = require("fast-check");

// 1. jest.mock() calls — must come before require()
jest.mock("axios");
jest.mock("dotenv", () => ({ config: jest.fn() }));

// Set env var BEFORE requiring the module (AI_API_KEY is read at load time)
process.env.AI_API_KEY = "test-api-key";

// 2. require module under test + mocked deps
const { summarizeChangelog, generateStaffResponse } = require("../aiService");
const axios = require("axios");

// ─────────────────────────────────────────────────────────────

describe("summarizeChangelog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 10.2 */
  it("should call axios.post with Anthropic URL, headers, and commit messages", async () => {
    axios.post.mockResolvedValue({
      data: { content: [{ text: "Summary" }] },
    });

    await summarizeChangelog("fix: bug fix\nfeat: new feature");

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = axios.post.mock.calls[0];

    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(config.headers["x-api-key"]).toBe("test-api-key");
    expect(config.headers["anthropic-version"]).toBe("2023-06-01");
    expect(config.headers["Content-Type"]).toBe("application/json");
    expect(body.messages[0].content).toContain("fix: bug fix\nfeat: new feature");
  });

  /** @requirement 10.3 */
  it("should return trimmed response text", async () => {
    axios.post.mockResolvedValue({
      data: { content: [{ text: "  Summary text  " }] },
    });

    const result = await summarizeChangelog("some commits");

    expect(result).toBe("Summary text");
  });

  /** @requirement 10.4 */
  it("should return null on API failure", async () => {
    axios.post.mockRejectedValue(new Error("Network error"));

    const result = await summarizeChangelog("some commits");

    expect(result).toBeNull();
  });

  /** Feature: controller-unit-tests, Property 10: summarizeChangelog passes commit messages to Anthropic API
   *  Validates: Requirements 10.2
   */
  it("should pass any commit message string to the Anthropic API", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (commitMessages) => {
          jest.clearAllMocks();
          axios.post.mockResolvedValue({
            data: { content: [{ text: "Summary" }] },
          });

          await summarizeChangelog(commitMessages);

          expect(axios.post).toHaveBeenCalledTimes(1);
          const [url, body, config] = axios.post.mock.calls[0];
          expect(url).toBe("https://api.anthropic.com/v1/messages");
          expect(config.headers["x-api-key"]).toBe("test-api-key");
          expect(body.messages[0].content).toContain(commitMessages);
        }
      )
    );
  });

  /** Feature: controller-unit-tests, Property 11: summarizeChangelog returns trimmed API response
   *  Validates: Requirements 10.3
   */
  it("should return the trimmed text from the API response", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (text) => {
          jest.clearAllMocks();
          const padded = `  ${text}  `;
          axios.post.mockResolvedValue({
            data: { content: [{ text: padded }] },
          });

          const result = await summarizeChangelog("commits");

          expect(result).toBe(padded.trim());
        }
      )
    );
  });
});

// ─────────────────────────────────────────────────────────────

describe("generateStaffResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 10.5 */
  it("should call axios.post with Anthropic URL and messages in body", async () => {
    axios.post.mockResolvedValue({
      data: { content: [{ text: "Response" }] },
    });

    await generateStaffResponse("Alice: hello\nBob: hi");

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, body] = axios.post.mock.calls[0];

    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(body.messages[0].content).toContain("Alice: hello\nBob: hi");
  });

  /** @requirement 10.6 */
  it("should return trimmed response text", async () => {
    axios.post.mockResolvedValue({
      data: { content: [{ text: "  Staff response  " }] },
    });

    const result = await generateStaffResponse("some messages");

    expect(result).toBe("Staff response");
  });

  /** @requirement 10.7 */
  it("should return null on empty content", async () => {
    axios.post.mockResolvedValue({
      data: { content: [] },
    });

    const result = await generateStaffResponse("some messages");

    expect(result).toBeNull();
  });

  /** @requirement 10.7 */
  it("should return null when content is undefined", async () => {
    axios.post.mockResolvedValue({
      data: {},
    });

    const result = await generateStaffResponse("some messages");

    expect(result).toBeNull();
  });

  /** @requirement 10.8 */
  it("should return null on API failure", async () => {
    axios.post.mockRejectedValue(new Error("API error"));

    const result = await generateStaffResponse("some messages");

    expect(result).toBeNull();
  });

  /** Feature: controller-unit-tests, Property 12: generateStaffResponse passes messages to Anthropic API
   *  Validates: Requirements 10.5
   */
  it("should pass any message string to the Anthropic API", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (messages) => {
          jest.clearAllMocks();
          axios.post.mockResolvedValue({
            data: { content: [{ text: "Response" }] },
          });

          await generateStaffResponse(messages);

          expect(axios.post).toHaveBeenCalledTimes(1);
          const [url, body] = axios.post.mock.calls[0];
          expect(url).toBe("https://api.anthropic.com/v1/messages");
          expect(body.messages[0].content).toContain(messages);
        }
      )
    );
  });

  /** Feature: controller-unit-tests, Property 13: generateStaffResponse returns trimmed API response
   *  Validates: Requirements 10.6
   */
  it("should return the trimmed text from the API response", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (text) => {
          jest.clearAllMocks();
          const padded = `  ${text}  `;
          axios.post.mockResolvedValue({
            data: { content: [{ text: padded }] },
          });

          const result = await generateStaffResponse("messages");

          expect(result).toBe(padded.trim());
        }
      )
    );
  });
});
