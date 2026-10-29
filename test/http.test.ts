import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
const port = 18973,
  base = `http://localhost:${port}`;
const password = "test-owner-password-never-real";
const child = spawn(process.execPath, ["src/server.ts"], {
  env: {
    ...process.env,
    PORT: String(port),
    PUBLIC_URL: "",
    RENDER_EXTERNAL_URL: base,
    OWNER_PASSWORD: password,
    AUTH_SIGNING_SECRET: "test-signing-secret-not-for-production",
    ZOTERO_USER_ID: "123",
    ZOTERO_API_KEY: "mock-only-never-real",
    WRITE_ENABLED: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let stderr = "";
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});
const ready = new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(
    () => reject(new Error("Démarrage impossible : " + stderr)),
    5000,
  );
  child.stdout.once("data", () => {
    clearTimeout(timeout);
    resolve();
  });
  child.once("exit", () => {
    clearTimeout(timeout);
    reject(new Error(stderr));
  });
});
after(() => {
  child.kill();
});
let token = "";
const verifier = "a".repeat(43),
  challenge = createHash("sha256").update(verifier).digest("base64url");
const authorization = () =>
  new URLSearchParams({
    client_id: "zotero-cloud-personal",
    redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect",
    response_type: "code",
    code_challenge_method: "S256",
    code_challenge: challenge,
    resource: base + "/mcp",
    scope: "zotero:read zotero:write",
    state: "original-state",
  });
test("MCP privé : 401 et découverte OAuth PKCE", async () => {
  await ready;
  const r = await fetch(base + "/mcp", { method: "POST" });
  assert.equal(r.status, 401);
  assert.match(r.headers.get("WWW-Authenticate")!, /oauth-protected-resource/);
  const meta = await (
    await fetch(base + "/.well-known/oauth-authorization-server")
  ).json();
  assert.deepEqual(meta.code_challenge_methods_supported, ["S256"]);
});
test("OAuth interdit redirect arbitraire et ressource incorrecte", async () => {
  const q = authorization();
  q.set("redirect_uri", "https://evil.example");
  assert.equal((await fetch(base + "/authorize?" + q)).status, 400);
  q.set(
    "redirect_uri",
    "https://chatgpt.com/connector_platform_oauth_redirect",
  );
  q.set("resource", "https://evil.example");
  assert.equal((await fetch(base + "/authorize?" + q)).status, 400);
});
test("consentement propriétaire, PKCE et code à usage unique", async () => {
  const page = await fetch(base + "/authorize?" + authorization());
  assert.equal(page.status, 200);
  // A real browser form navigates in non-CORS mode: no-referrer would
  // replace Origin with null and reject even a correct owner password.
  assert.equal(page.headers.get("Referrer-Policy"), "strict-origin");
  assert.match(
    page.headers.get("Content-Security-Policy")!,
    /form-action 'self' https:\/\/chatgpt\.com;/,
  );
  const cookie = page.headers.get("set-cookie")!.split(";")[0];
  const consent = (await page.text()).match(
    /name="consent" value="([^"]+)"/,
  )![1];
  const body = new URLSearchParams({ password, consent });
  const missingCookie = await fetch(base + "/authorize", {
    method: "POST",
    body,
    headers: { Origin: base },
    redirect: "manual",
  });
  assert.equal(missingCookie.status, 403);
  assert.match(await missingCookie.text(), /session du navigateur est absente/);
  const wrongOrigin = await fetch(base + "/authorize", {
    method: "POST",
    body,
    headers: { Origin: "https://evil.example", Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(wrongOrigin.status, 403);
  assert.match(await wrongOrigin.text(), /Origine du formulaire non reconnue/);
  const wrongPassword = await fetch(base + "/authorize", {
    method: "POST",
    body: new URLSearchParams({ password: "wrong-password", consent }),
    headers: { Origin: base, Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(wrongPassword.status, 403);
  assert.equal(wrongPassword.headers.get("Referrer-Policy"), "strict-origin");
  const retryForm = await wrongPassword.text();
  assert.match(retryForm, /mot de passe ne correspond pas/);
  assert.match(retryForm, /<form method="post"/);
  assert(!retryForm.includes(password));
  assert(!retryForm.includes('value="wrong-password"'));
  const response = await fetch(base + "/authorize", {
    method: "POST",
    body,
    headers: { Origin: base, Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location")!);
  assert.equal(location.searchParams.get("state"), "original-state");
  assert.equal(location.searchParams.get("iss"), base);
  const reusedConsent = await fetch(base + "/authorize", {
    method: "POST",
    body,
    headers: { Origin: base, Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(reusedConsent.status, 403);
  assert.match(await reusedConsent.text(), /déjà été utilisée/);
  const grant = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "zotero-cloud-personal",
    redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect",
    resource: base + "/mcp",
    code: location.searchParams.get("code")!,
    code_verifier: "b".repeat(43),
  });
  assert.equal(
    (await fetch(base + "/token", { method: "POST", body: grant })).status,
    400,
  );
  grant.set("code_verifier", verifier);
  const result = await (
    await fetch(base + "/token", { method: "POST", body: grant })
  ).json();
  assert.equal(result.token_type, "Bearer");
  token = result.access_token;
  assert(token);
  assert.equal(
    (await fetch(base + "/token", { method: "POST", body: grant })).status,
    400,
  );
});
async function rpc(method: string, params: unknown, id = 1) {
  const r = await fetch(base + "/mcp", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  assert.equal(r.status, 200);
  return r.json();
}
test("SDK MCP réel : initialize et huit tools annotés sans suppression", async () => {
  const init = await rpc("initialize", {
    protocolVersion: "2026-07-28",
    capabilities: {},
    clientInfo: { name: "test", version: "1" },
  });
  assert.equal(init.result.serverInfo.name, "zotero-cloud");
  const list = await rpc("tools/list", {});
  assert.equal(list.result.tools.length, 8);
  for (const tool of list.result.tools) {
    assert(!/delete|remove/.test(tool.name));
    assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
    assert.equal(typeof tool.annotations.destructiveHint, "boolean");
    assert(tool.inputSchema);
    assert.deepEqual(tool.securitySchemes, tool._meta.securitySchemes);
  }
  assert.equal(
    list.result.tools.find((t: any) => t.name === "update_item").annotations
      .destructiveHint,
    true,
  );
});
test("écriture MCP désactivée : zéro accès Zotero nécessaire", async () => {
  const r = await rpc("tools/call", {
    name: "add_tags",
    arguments: { key: "ABCDEFGH", expectedVersion: 1, tags: ["test"] },
  });
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /WRITES_DISABLED/);
});
test("token falsifié et origine étrangère refusés", async () => {
  assert.equal(
    (
      await fetch(base + "/mcp", {
        method: "POST",
        headers: { Authorization: "Bearer fake" },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await fetch(base + "/mcp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: "https://evil.example",
        },
      })
    ).status,
    403,
  );
});
