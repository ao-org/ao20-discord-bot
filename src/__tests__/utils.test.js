/**
 * @file Tests for src/utils.js
 * @see requirements.md Requirement 2
 */

const fc = require("fast-check");
const { getRandomElement, emoji } = require("../utils");

// ─────────────────────────────────────────────────────────────

describe("getRandomElement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 2.2 */
  it("should return a member of the input array when called with a non-empty array", () => {
    const input = ["a", "b", "c"];
    const result = getRandomElement(input);
    expect(input).toContain(result);
  });

  /** @requirement 2.3 */
  it("should return the single element when called with a single-element array", () => {
    const input = [42];
    const result = getRandomElement(input);
    expect(result).toBe(42);
  });

  /** Feature: controller-unit-tests, Property 1: getRandomElement output membership */
  /** Validates: Requirements 2.2, 2.3, 2.5 */
  it("should always return a member of the input array (property)", () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 1 }), (arr) => {
        const result = getRandomElement(arr);
        return arr.includes(result);
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────

describe("emoji", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** @requirement 2.4 */
  it("should return one of the five predefined emoji strings", () => {
    const validEmojis = [":man_mage:", ":woman_mage:", ":crossed_swords:", ":boom:", ":fire:"];
    const result = emoji();
    expect(validEmojis).toContain(result);
  });
});
