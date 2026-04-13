/**
 * @file Tests for src/services/githubService.js
 * @see requirements.md Requirement 11
 */

const fc = require("fast-check");

// 1. jest.mock() calls — must come before require()
jest.mock("axios");
jest.mock("dotenv", () => ({ config: jest.fn() }));

// Set env var BEFORE requiring the module (GITHUB_TOKEN is read at load time)
process.env.GITHUB_TOKEN = "test-github-token";

// 2. require module under test + mocked deps
const { fetchLatestTags, fetchChangelog } = require("../githubService");
const axios = require("axios");

// ─────────────────────────────────────────────────────────────

describe("fetchLatestTags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 11.2 */
  it("should call axios.get with correct GitHub tags URL and auth headers", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          { name: "v1.1.0", commit: { url: "https://api.github.com/repos/owner/repo/commits/abc" } },
          { name: "v1.0.0", commit: { url: "https://api.github.com/repos/owner/repo/commits/def" } },
        ],
      })
      .mockResolvedValueOnce({
        data: { commit: { committer: { date: "2024-02-01T00:00:00Z" } } },
      })
      .mockResolvedValueOnce({
        data: { commit: { committer: { date: "2024-01-01T00:00:00Z" } } },
      });

    await fetchLatestTags("owner/repo");

    expect(axios.get).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/tags",
      {
        headers: {
          Authorization: "token test-github-token",
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
  });

  /** @requirement 11.3 */
  it("should return two tag objects with name and date when API returns >= 2 tags", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          { name: "v1.1.0", commit: { url: "https://api.github.com/repos/owner/repo/commits/abc" } },
          { name: "v1.0.0", commit: { url: "https://api.github.com/repos/owner/repo/commits/def" } },
        ],
      })
      .mockResolvedValueOnce({
        data: { commit: { committer: { date: "2024-02-01T00:00:00Z" } } },
      })
      .mockResolvedValueOnce({
        data: { commit: { committer: { date: "2024-01-01T00:00:00Z" } } },
      });

    const result = await fetchLatestTags("owner/repo");

    expect(result).toEqual([
      { name: "v1.1.0", date: "2024-02-01T00:00:00Z" },
      { name: "v1.0.0", date: "2024-01-01T00:00:00Z" },
    ]);
  });

  /** @requirement 11.4 */
  it("should return null when API returns fewer than 2 tags", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          { name: "v1.0.0", commit: { url: "https://api.github.com/repos/owner/repo/commits/abc" } },
        ],
      })
      .mockResolvedValueOnce({
        data: { commit: { committer: { date: "2024-01-01T00:00:00Z" } } },
      });

    const result = await fetchLatestTags("owner/repo");

    expect(result).toBeNull();
  });

  /** @requirement 11.5 */
  it("should return null when API returns an empty array", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const result = await fetchLatestTags("owner/repo");

    expect(result).toBeNull();
  });

  /** Feature: controller-unit-tests, Property 14: fetchLatestTags constructs correct GitHub API URL */
  /** Validates: Requirements 11.2 */
  it("should construct correct GitHub API URL for any repo name (property)", async () => {
    const repoArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
      fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s))
    ).map(([owner, name]) => `${owner}/${name}`);

    await fc.assert(
      fc.asyncProperty(repoArb, async (repo) => {
        jest.clearAllMocks();
        axios.get
          .mockResolvedValueOnce({
            data: [
              { name: "v1.1.0", commit: { url: "https://api.github.com/commits/abc" } },
              { name: "v1.0.0", commit: { url: "https://api.github.com/commits/def" } },
            ],
          })
          .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-02-01" } } } })
          .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-01-01" } } } });

        await fetchLatestTags(repo);

        expect(axios.get).toHaveBeenCalledWith(
          `https://api.github.com/repos/${repo}/tags`,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "token test-github-token",
            }),
          })
        );
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────

describe("fetchChangelog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 11.6 */
  it("should call axios.get with the compare URL using the two tag names", async () => {
    axios.get
      // fetchLatestTags calls
      .mockResolvedValueOnce({
        data: [
          { name: "v1.1.0", commit: { url: "https://api.github.com/commits/abc" } },
          { name: "v1.0.0", commit: { url: "https://api.github.com/commits/def" } },
        ],
      })
      .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-02-01" } } } })
      .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-01-01" } } } })
      // compare API call
      .mockResolvedValueOnce({
        data: {
          commits: [
            { commit: { message: "fix: bug fix" } },
            { commit: { message: "feat: new feature" } },
          ],
        },
      });

    await fetchChangelog("owner/repo");

    // 4th call is the compare API
    const compareCall = axios.get.mock.calls[3];
    expect(compareCall[0]).toBe(
      "https://api.github.com/repos/owner/repo/compare/v1.0.0...v1.1.0"
    );
    expect(compareCall[1]).toEqual({
      headers: {
        Authorization: "token test-github-token",
        Accept: "application/vnd.github.v3+json",
      },
    });
  });

  /** @requirement 11.7 */
  it("should return object with all required fields", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          { name: "v1.1.0", commit: { url: "https://api.github.com/commits/abc" } },
          { name: "v1.0.0", commit: { url: "https://api.github.com/commits/def" } },
        ],
      })
      .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-02-01" } } } })
      .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-01-01" } } } })
      .mockResolvedValueOnce({
        data: {
          commits: [
            { commit: { message: "fix: bug fix" } },
            { commit: { message: "feat: new feature" } },
          ],
        },
      });

    const result = await fetchChangelog("owner/repo");

    expect(result).toEqual({
      repoName: "repo",
      previousTag: "v1.0.0",
      previousTagDate: "2024-01-01",
      latestTag: "v1.1.0",
      latestTagDate: "2024-02-01",
      commitMessages: "- fix: bug fix\n- feat: new feature",
    });
  });

  /** @requirement 11.8 */
  it("should return null when fetchLatestTags returns null", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const result = await fetchChangelog("owner/repo");

    expect(result).toBeNull();
  });

  /** @requirement 11.9 */
  it("should return null when compare API call fails", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          { name: "v1.1.0", commit: { url: "https://api.github.com/commits/abc" } },
          { name: "v1.0.0", commit: { url: "https://api.github.com/commits/def" } },
        ],
      })
      .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-02-01" } } } })
      .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-01-01" } } } })
      .mockRejectedValueOnce(new Error("API error"));

    const result = await fetchChangelog("owner/repo");

    expect(result).toBeNull();
  });

  /** Feature: controller-unit-tests, Property 15: fetchChangelog returns object with all required fields */
  /** Validates: Requirements 11.7 */
  it("should return object with all required fields for any valid repo (property)", async () => {
    const repoArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
      fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s))
    ).map(([owner, name]) => `${owner}/${name}`);

    const commitArb = fc.array(
      fc.string({ minLength: 1, maxLength: 50 }),
      { minLength: 1, maxLength: 5 }
    );

    await fc.assert(
      fc.asyncProperty(repoArb, commitArb, async (repo, commitMsgs) => {
        jest.clearAllMocks();
        axios.get
          .mockResolvedValueOnce({
            data: [
              { name: "v2.0.0", commit: { url: "https://api.github.com/commits/abc" } },
              { name: "v1.0.0", commit: { url: "https://api.github.com/commits/def" } },
            ],
          })
          .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-02-01" } } } })
          .mockResolvedValueOnce({ data: { commit: { committer: { date: "2024-01-01" } } } })
          .mockResolvedValueOnce({
            data: {
              commits: commitMsgs.map(msg => ({ commit: { message: msg } })),
            },
          });

        const result = await fetchChangelog(repo);

        expect(result).toHaveProperty("repoName");
        expect(result).toHaveProperty("previousTag");
        expect(result).toHaveProperty("latestTag");
        expect(result).toHaveProperty("commitMessages");
        expect(result).toHaveProperty("previousTagDate");
        expect(result).toHaveProperty("latestTagDate");
        expect(result.repoName).toBe(repo.split("/")[1]);
      })
    );
  });
});
