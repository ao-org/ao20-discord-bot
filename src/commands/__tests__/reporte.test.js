/**
 * @file Tests for src/commands/reporte.js
 * @see requirements.md Requirement 7
 */

// 1. jest.mock() calls — must come before require()
jest.mock("axios");
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
const { execute, sendReport, getLastReport } = require("../reporte");
const axios = require("axios");
const { SuccessEmbed, ErrorEmbed } = require("../../embeds");
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

const mockReportData = {
  data: {
    Gold: "1000000",
    DBData: { EndDB: "2024-01-01", StartDB: "2024-01-02" },
    Reports: {
      User1: { AccID: "1", BaseLevel: "10", CharID: "100", Warnings: null, Errors: null },
      User2: { AccID: "2", BaseLevel: "20", CharID: "200", Warnings: "warn", Errors: "err" },
    },
    AccountReports: {
      Acc1: { AccID: "1", Warnings: null, Errors: null },
    },
  },
};

const noReportsData = {
  data: {
    Gold: "0",
    DBData: { EndDB: "2024-01-01", StartDB: "2024-01-02" },
    Reports: "There are no reports",
    AccountReports: "There are no reports",
  },
};

// ─────────────────────────────────────────────────────────────

describe("execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue(mockReportData);
  });

  /** @requirement 7.2 */
  it("should call sendReport when channel id is the allowed channel", async () => {
    const message = makeMessage({ channel: { id: "1031483686828384276", send: jest.fn().mockResolvedValue({}) } });

    await execute(message, []);
    // sendReport is fire-and-forget (not awaited), flush the microtask queue
    await new Promise(setImmediate);

    // sendReport calls getLastReport which calls axios.get
    expect(axios.get).toHaveBeenCalled();
    expect(ErrorEmbed).not.toHaveBeenCalled();
  });

  /** @requirement 7.3 */
  it("should send ErrorEmbed when channel id is not the allowed channel", async () => {
    const message = makeMessage({ channel: { id: "999", send: jest.fn().mockResolvedValue({}) } });

    await execute(message, []);

    expect(ErrorEmbed).toHaveBeenCalledTimes(1);
    expect(message.channel.send).toHaveBeenCalledTimes(1);
    const embedInstance = ErrorEmbed.mock.results[0].value;
    expect(embedInstance.setTitle).toHaveBeenCalledWith("Error");
    expect(embedInstance.setDescription).toHaveBeenCalledWith(
      "Este comando solo se puede usar en el canal de reportes."
    );
  });

  /**
   * Feature: controller-unit-tests, Property 6: Reporte rejects non-allowed channels
   *
   * For any channel ID that is not "1031483686828384276", calling execute should
   * result in channel.send being called with an ErrorEmbed and sendReport should
   * not be invoked.
   *
   * Validates: Requirements 7.3
   */
  it("should reject any non-allowed channel id (property)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => s !== "1031483686828384276"),
        async (channelId) => {
          jest.clearAllMocks();
          axios.get.mockResolvedValue(mockReportData);

          const message = makeMessage({
            channel: { id: channelId, send: jest.fn().mockResolvedValue({}) },
          });

          await execute(message, []);

          expect(ErrorEmbed).toHaveBeenCalledTimes(1);
          expect(message.channel.send).toHaveBeenCalledTimes(1);
        }
      )
    );
  });
});

// ─────────────────────────────────────────────────────────────

describe("getLastReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASIC_AUTH_ESTADISTICAS_USERNAME = "testuser";
    process.env.BASIC_AUTH_ESTADISTICAS_PASSWORD = "testpass";
    axios.get.mockResolvedValue(mockReportData);
  });

  /** @requirement 7.4 */
  it("should call axios.get with the correct URL and basic auth credentials", async () => {
    await getLastReport();

    expect(axios.get).toHaveBeenCalledWith(
      "http://estadisticas.ao20.com.ar/produccion/reports.php?last=true&dir=reports",
      {
        auth: {
          username: "testuser",
          password: "testpass",
        },
      }
    );
  });
});

// ─────────────────────────────────────────────────────────────

describe("sendReport", () => {
  let channel;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASIC_AUTH_ESTADISTICAS_USERNAME = "testuser";
    process.env.BASIC_AUTH_ESTADISTICAS_PASSWORD = "testpass";
    channel = { send: jest.fn().mockResolvedValue({}) };
  });

  /** @requirement 7.5 */
  it("should send the gold embed", async () => {
    axios.get.mockResolvedValue(mockReportData);

    await sendReport(channel);

    // First call is always the gold embed
    expect(SuccessEmbed).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalled();
    const firstEmbed = SuccessEmbed.mock.results[0].value;
    expect(firstEmbed.setTitle).toHaveBeenCalledWith("Oro total del mundo (no incluye valor de items)");
  });

  /** @requirement 7.5 */
  it("should send user report embeds for each user", async () => {
    axios.get.mockResolvedValue(mockReportData);

    await sendReport(channel);

    // 1 gold + 2 users + 1 account = 4 total sends
    expect(channel.send).toHaveBeenCalledTimes(4);
  });

  /** @requirement 7.6 */
  it('should not send user report embeds when Reports is "There are no reports"', async () => {
    axios.get.mockResolvedValue(noReportsData);

    await sendReport(channel);

    // Only the gold embed should be sent
    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  /** @requirement 7.7 */
  it('should not send account report embeds when AccountReports is "There are no reports"', async () => {
    const mixedData = {
      data: {
        Gold: "500",
        DBData: { EndDB: "2024-01-01", StartDB: "2024-01-02" },
        Reports: {
          User1: { AccID: "1", BaseLevel: "10", CharID: "100", Warnings: null, Errors: null },
        },
        AccountReports: "There are no reports",
      },
    };
    axios.get.mockResolvedValue(mixedData);

    await sendReport(channel);

    // 1 gold + 1 user + 0 accounts = 2 total sends
    expect(channel.send).toHaveBeenCalledTimes(2);
  });

  /**
   * Feature: controller-unit-tests, Property 7: Reporte send count equals gold embed plus user reports
   *
   * For any report data containing N user reports (N >= 1) and M account reports (M >= 1),
   * calling sendReport should result in channel.send being called exactly 1 + N + M times
   * (one gold embed, N user report embeds, M account report embeds).
   *
   * Validates: Requirements 7.5
   */
  it("should send exactly 1 + N + M embeds for N users and M accounts (property)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 3 }),
        async (userCount, accountCount) => {
          jest.clearAllMocks();

          const Reports = {};
          for (let i = 0; i < userCount; i++) {
            Reports[`User${i}`] = {
              AccID: String(i),
              BaseLevel: "10",
              CharID: String(i * 100),
              Warnings: null,
              Errors: null,
            };
          }

          const AccountReports = {};
          for (let i = 0; i < accountCount; i++) {
            AccountReports[`Acc${i}`] = {
              AccID: String(i),
              Warnings: null,
              Errors: null,
            };
          }

          axios.get.mockResolvedValue({
            data: {
              Gold: "100",
              DBData: { EndDB: "2024-01-01", StartDB: "2024-01-02" },
              Reports,
              AccountReports,
            },
          });

          const ch = { send: jest.fn().mockResolvedValue({}) };
          await sendReport(ch);

          expect(ch.send).toHaveBeenCalledTimes(1 + userCount + accountCount);
        }
      )
    );
  });
});
