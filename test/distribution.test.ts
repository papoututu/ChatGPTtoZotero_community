import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
const exec = promisify(execFile);
test("le paquet personnel utilise seulement les identifiants fournis et conserve les consignes", async () => {
  const temp = await mkdtemp(join(tmpdir(), "zotero-package-"));
  const out = join(temp, "zotero-cloud");
  const appId = "asdk_app_" + "0".repeat(32);
  try {
    await exec(process.execPath, [
      "scripts/package-plugin.ts",
      "--url",
      "https://example.onrender.com",
      "--app-id",
      appId,
      "--out",
      out,
      "--archive",
    ]);
    const manifest = JSON.parse(
      await readFile(join(out, "plugin.json"), "utf8"),
    );
    const mcp = JSON.parse(await readFile(join(out, "mcp.json"), "utf8"));
    const app = JSON.parse(await readFile(join(out, ".app.json"), "utf8"));
    assert.equal(manifest.extensions["com.openai"].apps, "./.app.json");
    assert.equal(
      mcp.mcpServers["zotero-cloud"].url,
      "https://example.onrender.com/mcp",
    );
    assert.equal(app.apps["zotero-cloud"].id, appId);
    assert.match(
      await readFile(join(out, "skills/zotero-library/SKILL.md"), "utf8"),
      /Never create a bibliographic item before searching/,
    );
    assert((await stat(out + ".tar.gz")).size > 0);
    await assert.rejects(
      exec(process.execPath, [
        "scripts/package-plugin.ts",
        "--url",
        "https://example.onrender.com",
        "--app-id",
        appId,
        "--out",
        out,
      ]),
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
test("le générateur refuse une URL contenant un secret sans afficher ce secret", async () => {
  try {
    await exec(process.execPath, [
      "scripts/package-plugin.ts",
      "--url",
      "https://user:sensitive-password@example.com",
      "--app-id",
      "asdk_app_" + "0".repeat(32),
    ]);
    assert.fail("should reject");
  } catch (e: any) {
    assert(!String(e.stderr).includes("sensitive-password"));
    assert.match(e.stderr, /URL HTTPS du serveur attendue/);
  }
});
test("le diagnostic public ne lit aucune bibliothèque", async () => {
  const paths: string[] = [];
  let base = "";
  const server = createServer((req, res) => {
    paths.push(req.url!);
    res.setHeader("Content-Type", "application/json");
    const data =
      req.url === "/health"
        ? { status: "ok" }
        : req.url === "/.well-known/oauth-protected-resource"
          ? { resource: base + "/mcp" }
          : req.url === "/.well-known/oauth-authorization-server"
            ? {
                authorization_endpoint: base + "/authorize",
                token_endpoint: base + "/token",
                code_challenge_methods_supported: ["S256"],
              }
            : {};
    if (req.url === "/mcp") {
      res.statusCode = 401;
      res.setHeader(
        "WWW-Authenticate",
        `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`,
      );
    }
    res.end(JSON.stringify(data));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  assert(addr && typeof addr !== "string");
  base = "http://127.0.0.1:" + addr.port;
  try {
    const r = await exec(process.execPath, [
      "scripts/doctor.ts",
      "--url",
      base,
    ]);
    assert.equal((r.stdout.match(/^OK /gm) || []).length, 4);
    assert.deepEqual(paths, [
      "/health",
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-authorization-server",
      "/mcp",
    ]);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});
