import { createServer } from "node:http";
import {
  NodeStreamableHTTPServerTransport,
  hostHeaderValidation,
} from "@modelcontextprotocol/node";
import { OwnerAuth, json, readBody } from "./auth.ts";
import { Zotero } from "./zotero.ts";
import { Library } from "./library.ts";
import { makeMcp } from "./mcp.ts";
import { readConfig } from "./config.ts";
const config = readConfig(process.env);
const { publicUrl } = config;
const auth = new OwnerAuth({
  publicUrl,
  secret: config.signingSecret,
  password: config.ownerPassword,
  clientId: config.clientId,
  redirectUri: config.redirectUri,
});
const api = new Zotero(async () => ({
  userId: config.userId,
  apiKey: config.apiKey,
}));
const library = new Library(api, config.writeEnabled);
const hostGuard = hostHeaderValidation([new URL(publicUrl).hostname]);

const http = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  try {
    if (!hostGuard(req, res)) return;
    const path = new URL(req.url || "/", publicUrl);
    if (path.pathname === "/health" && req.method === "GET") {
      json(res, 200, { status: "ok" });
      return;
    }
    if (await auth.handle(req, res, path)) return;
    if (path.pathname !== "/mcp") {
      json(res, 404, { error: "not_found" });
      return;
    }
    if (
      req.headers.origin &&
      ![publicUrl, "https://chatgpt.com"].includes(req.headers.origin)
    ) {
      json(res, 403, { error: "forbidden_origin" });
      return;
    }
    if (!(await auth.verify(req.headers.authorization))) {
      auth.challenge(res);
      return;
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      json(res, 405, { error: "method_not_allowed" });
      return;
    }
    const body = JSON.parse(await readBody(req, 262144));
    const mcp = makeMcp(library),
      transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
    res.on("close", () => {
      void transport.close();
      void mcp.close();
    });
    await mcp.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch {
    if (!res.headersSent) json(res, 400, { error: "invalid_request" });
    else res.end();
  }
});
http.requestTimeout = 30000;
http.headersTimeout = 15000;
http.listen(config.port, "0.0.0.0", () =>
  console.log(
    "Zotero Cloud MCP démarré. Aucune donnée bibliographique ni secret journalisé.",
  ),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => http.close(() => process.exit(0)));
