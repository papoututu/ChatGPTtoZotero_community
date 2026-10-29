import { test } from "node:test";
import assert from "node:assert/strict";
import { readConfig } from "../src/config.ts";
const valid = {
  ZOTERO_USER_ID: "123",
  ZOTERO_API_KEY: "mock-api-key",
  OWNER_PASSWORD: "mock-password-at-least-20",
  AUTH_SIGNING_SECRET: "mock-signing-secret-at-least-32-characters",
};
test("Render déduit son URL, lecture seule par défaut", () => {
  const c = readConfig({
    ...valid,
    RENDER_EXTERNAL_URL: "https://example.onrender.com",
  });
  assert.equal(c.publicUrl, "https://example.onrender.com");
  assert.equal(c.writeEnabled, false);
});
test("les identifiants Zotero collés peuvent contenir des espaces périphériques", () => {
  assert.equal(readConfig({ ...valid, ZOTERO_USER_ID: " 123 " }).userId, "123");
});
test("les erreurs distinguent les paramètres et ne divulguent pas les secrets", () => {
  assert.throws(
    () =>
      readConfig({
        ...valid,
        ZOTERO_USER_ID: "not-numeric",
        OWNER_PASSWORD: "short-secret",
        WRITE_ENABLED: "yes",
      }),
    (e: Error) => {
      assert.match(e.message, /ZOTERO_USER_ID/);
      assert.match(e.message, /OWNER_PASSWORD/);
      assert.match(e.message, /WRITE_ENABLED/);
      assert(!e.message.includes("short-secret"));
      assert(!e.message.includes(valid.ZOTERO_API_KEY));
      return true;
    },
  );
});
test("une configuration sans clés ne démarre pas silencieusement", () => {
  assert.throws(() => readConfig({}), /ZOTERO_API_KEY/);
});
test("les écritures nécessitent la valeur true", () => {
  assert.equal(
    readConfig({ ...valid, WRITE_ENABLED: "true" }).writeEnabled,
    true,
  );
  assert.throws(
    () => readConfig({ ...valid, WRITE_ENABLED: '"true"' }),
    /WRITE_ENABLED/,
  );
});
test("origine HTTPS et callback ChatGPT vérifiés", () => {
  for (const url of [
    "http://example.com",
    "https://example.com/mcp",
    "https://user:pass@example.com",
    "ftp://localhost",
  ])
    assert.throws(
      () => readConfig({ ...valid, PUBLIC_URL: url }),
      /PUBLIC_URL/,
    );
  assert.throws(
    () =>
      readConfig({
        ...valid,
        OAUTH_REDIRECT_URI: "https://evil.example/callback",
      }),
    /OAUTH_REDIRECT_URI/,
  );
});
