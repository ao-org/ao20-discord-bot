// Feature: node-lts-upgrade, Property 1: Send calls use v14 object syntax

/**
 * Property-based test for send call v14 syntax.
 *
 * 1. Generates random embed and text payloads using fast-check, passes them
 *    through wrapper functions that mirror the migrated send pattern, and
 *    verifies the output always uses { embeds: [...] } or { content: ... }.
 *    No bare embed or bare string arguments should be passed to send methods.
 *
 * 2. Scans every source file that calls .send() and verifies every call uses
 *    the v14 object syntax (no bare positional arguments).
 *
 * **Validates: Requirements 2.1, 2.2**
 */

const fc = require("fast-check");
const fs = require("fs");
const path = require("path");
const { ErrorEmbed, SuccessEmbed } = require("../embeds");

// ---------------------------------------------------------------------------
// Wrapper helpers – these replicate the v14 send patterns used in the codebase
// ---------------------------------------------------------------------------

/**
 * Wraps an embed (or array of embeds) in v14 object syntax.
 * This is the pattern every migrated send call must follow for embeds.
 */
function wrapEmbed(embed) {
  const embeds = Array.isArray(embed) ? embed : [embed];
  return { embeds };
}

/**
 * Wraps a text payload in v14 object syntax.
 * This is the pattern every migrated send call must follow for text.
 */
function wrapText(text) {
  return { content: String(text) };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbTitle = fc.string({ minLength: 1, maxLength: 256 });
const arbDescription = fc.string({ minLength: 1, maxLength: 4096 });
const arbField = fc.record({
  name: fc.string({ minLength: 1, maxLength: 256 }),
  value: fc.string({ minLength: 1, maxLength: 1024 }),
  inline: fc.boolean(),
});
const arbFields = fc.array(arbField, { minLength: 0, maxLength: 25 });

// Generate a random ErrorEmbed or SuccessEmbed with random configuration
const arbEmbed = fc
  .record({
    type: fc.constantFrom("error", "success"),
    title: fc.option(arbTitle, { nil: undefined }),
    description: fc.option(arbDescription, { nil: undefined }),
    fields: arbFields,
  })
  .map(({ type, title, description, fields }) => {
    const embed = type === "error" ? new ErrorEmbed() : new SuccessEmbed();
    if (title !== undefined) embed.setTitle(title);
    if (description !== undefined) embed.setDescription(description);
    if (fields.length > 0) embed.addFields(...fields);
    return embed;
  });

// Generate a random text payload (non-empty string)
const arbText = fc.string({ minLength: 1, maxLength: 2000 });

// ---------------------------------------------------------------------------
// Source file scanning helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .js files under a directory, excluding node_modules
 * and __tests__ directories.
 */
function collectSourceFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      results.push(...collectSourceFiles(fullPath));
    } else if (entry.name.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Checks whether a .send( call at a given position uses v14 object syntax.
 * v14 syntax means the first argument after .send( is `{`.
 * Returns true if the call is valid v14 syntax, false if it's a bare argument.
 */
function sendCallUsesObjectSyntax(source, sendIndex) {
  // Find the opening paren after .send
  const parenIndex = source.indexOf("(", sendIndex);
  if (parenIndex === -1) return true; // not a real call

  // Skip whitespace and newlines after the opening paren
  let i = parenIndex + 1;
  while (i < source.length && /\s/.test(source[i])) i++;

  // The first non-whitespace character should be `{` for v14 object syntax
  // Also allow `)` for empty calls (unlikely but safe)
  return source[i] === "{" || source[i] === ")";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 1: Send calls use v14 object syntax", () => {
  it("wrapEmbed always produces { embeds: [...] } format", () => {
    fc.assert(
      fc.property(arbEmbed, (embed) => {
        const result = wrapEmbed(embed);

        // Must have an `embeds` key that is an array
        expect(result).toHaveProperty("embeds");
        expect(Array.isArray(result.embeds)).toBe(true);
        expect(result.embeds.length).toBeGreaterThanOrEqual(1);

        // Must not have bare embed properties at the top level
        expect(result).not.toHaveProperty("title");
        expect(result).not.toHaveProperty("description");
        expect(result).not.toHaveProperty("color");

        // Each item in embeds should be an embed instance
        for (const e of result.embeds) {
          const json = e.toJSON();
          expect(typeof json.color).toBe("number");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("wrapEmbed handles arrays of embeds correctly", () => {
    fc.assert(
      fc.property(fc.array(arbEmbed, { minLength: 1, maxLength: 10 }), (embeds) => {
        const result = wrapEmbed(embeds);

        expect(result).toHaveProperty("embeds");
        expect(Array.isArray(result.embeds)).toBe(true);
        expect(result.embeds.length).toBe(embeds.length);

        // Must not have bare embed properties at the top level
        expect(result).not.toHaveProperty("title");
        expect(result).not.toHaveProperty("description");
        expect(result).not.toHaveProperty("color");
      }),
      { numRuns: 100 }
    );
  });

  it("wrapText always produces { content: ... } format", () => {
    fc.assert(
      fc.property(arbText, (text) => {
        const result = wrapText(text);

        // Must have a `content` key that is a string
        expect(result).toHaveProperty("content");
        expect(typeof result.content).toBe("string");

        // Must not be a bare string (it's an object)
        expect(typeof result).toBe("object");
        expect(result).not.toBeNull();

        // Must not have embed-related keys
        expect(result).not.toHaveProperty("embeds");
      }),
      { numRuns: 100 }
    );
  });

  it("no source file uses bare .send() arguments (static analysis)", () => {
    const srcDir = path.resolve(__dirname, "..");
    const sourceFiles = collectSourceFiles(srcDir);

    // We must find at least the known command files
    expect(sourceFiles.length).toBeGreaterThan(0);

    for (const filePath of sourceFiles) {
      const source = fs.readFileSync(filePath, "utf-8");
      const relativePath = path.relative(srcDir, filePath);

      // Find all .send( occurrences
      const sendRegex = /\.send\s*\(/g;
      let match;
      while ((match = sendRegex.exec(source)) !== null) {
        const isValid = sendCallUsesObjectSyntax(source, match.index);
        expect(isValid).toBe(true);
      }
    }
  });
});
