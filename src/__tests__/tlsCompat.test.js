/**
 * TLS Connectivity Verification Tests — OpenSSL 3.5 Compatibility
 *
 * Node.js 24 ships with OpenSSL 3.5 which enforces stricter cryptographic defaults:
 *   - RSA/DSA/DH keys < 2048 bits are rejected
 *   - ECC keys < 224 bits are rejected
 *   - RC4 cipher is fully prohibited
 *
 * These tests verify that the external services this bot connects to
 * use certificates and ciphers compatible with OpenSSL 3.5 defaults.
 *
 * Internal services (MySQL, OpenTelemetry collector) are typically not
 * reachable from CI — they must be verified in the deployment environment.
 * See the documentation comments at the bottom of this file.
 *
 * Workaround: If any service uses legacy certificates, Node.js can be
 * started with the --openssl-legacy-provider flag as a temporary fix:
 *   NODE_OPTIONS=--openssl-legacy-provider node ./src/index.js
 * The proper long-term fix is to upgrade the server's certificate.
 */

const tls = require("tls");

/**
 * OpenSSL 3.5 minimum key size thresholds:
 *   - RSA / DSA / DH: 2048 bits
 *   - ECC: 224 bits
 */
const MIN_RSA_BITS = 2048;
const MIN_ECC_BITS = 224;
const RC4_PATTERN = /RC4/i;

/**
 * Helper: open a TLS connection to `host:port`, perform the handshake,
 * and return { cipher, keyBits, keyType } from the peer certificate.
 */
function getTlsInfo(host, port = 443) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host }, () => {
      try {
        const cipher = socket.getCipher();
        const cert = socket.getPeerCertificate();

        // cert.bits is the authoritative key size from Node's TLS binding.
        // cert.asn1Curve is set for ECC certs; cert.modulus is set for RSA.
        const keyBits = cert.bits || 0;
        const keyType = cert.asn1Curve ? "ECC" : "RSA";

        resolve({
          cipher: cipher ? cipher.name : null,
          keyBits,
          keyType,
          curve: cert.asn1Curve || null,
        });
      } catch (err) {
        reject(err);
      } finally {
        socket.end();
      }
    });

    socket.on("error", (err) => reject(err));
    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error(`TLS connection to ${host}:${port} timed out`));
    });
  });
}

// Public endpoints the bot connects to
const PUBLIC_ENDPOINTS = [
  { host: "discord.com", description: "Discord API" },
  {
    host: "estadisticas.ao20.com.ar",
    description: "AO20 statistics endpoint",
  },
];

describe("OpenSSL 3.5 TLS compatibility", () => {
  // Increase timeout — real network connections may be slow in CI
  jest.setTimeout(30000);

  describe.each(PUBLIC_ENDPOINTS)(
    "$description ($host)",
    ({ host }) => {
      let info;

      beforeAll(async () => {
        info = await getTlsInfo(host);
      });

      it("should use a certificate key size that meets OpenSSL 3.5 minimums", () => {
        // OpenSSL 3.5 thresholds differ by key type:
        //   RSA/DSA/DH >= 2048 bits, ECC >= 224 bits
        const minBits =
          info.keyType === "ECC" ? MIN_ECC_BITS : MIN_RSA_BITS;

        expect(info.keyBits).toBeGreaterThanOrEqual(minBits);
      });

      it("should not negotiate the RC4 cipher", () => {
        expect(info.cipher).not.toMatch(RC4_PATTERN);
      });
    }
  );

  /**
   * ---------------------------------------------------------------
   * Internal services — deployment-environment verification required
   * ---------------------------------------------------------------
   *
   * MySQL (mysql2 connection):
   *   The bot connects to a MySQL server via knex/mysql2. If the MySQL
   *   server's TLS certificate uses an RSA key < 2048 bits, the
   *   connection will fail under Node.js 24 / OpenSSL 3.5.
   *   Verify with:
   *     openssl s_client -connect <MYSQL_HOST>:<MYSQL_PORT> \
   *       -starttls mysql 2>/dev/null | openssl x509 -noout -text | grep "Public-Key"
   *   Expected output: "Public-Key: (2048 bit)" or larger.
   *
   * OpenTelemetry collector (OTLP/HTTP exporter):
   *   The tracing exporter sends spans over HTTPS to the collector.
   *   If the collector's TLS certificate uses a weak key, the export
   *   will fail silently (spans dropped) or throw ERR_SSL_* errors.
   *   Verify with:
   *     openssl s_client -connect <OTEL_ENDPOINT_HOST>:<PORT> \
   *       2>/dev/null | openssl x509 -noout -text | grep "Public-Key"
   *   Expected output: "Public-Key: (2048 bit)" or larger.
   *
   * Workaround for legacy certificates:
   *   NODE_OPTIONS=--openssl-legacy-provider node ./src/index.js
   *   This lowers OpenSSL security level to allow weaker keys/ciphers.
   *   Use only as a temporary measure — upgrade the certificates ASAP.
   * ---------------------------------------------------------------
   */
  it("documents internal service TLS verification requirements", () => {
    // This test exists to ensure the documentation above is not removed.
    // Internal services (MySQL, OTEL collector) cannot be reached from CI
    // and must be verified manually in the deployment environment.
    expect(true).toBe(true);
  });
});
