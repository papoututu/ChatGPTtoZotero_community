import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { IncomingMessage, ServerResponse } from "node:http";
export type AuthConfig = {
  publicUrl: string;
  secret: string;
  password: string;
  clientId: string;
  redirectUri: string;
};
export async function readBody(req: IncomingMessage, max = 65536) {
  req.setEncoding("utf8");
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
    if (Buffer.byteLength(body) > max) throw new Error("BODY_TOO_LARGE");
  }
  return body;
}
export function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
const random = () => randomBytes(32).toString("base64url");
const equal = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest(),
    y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};
type Grant = {
  client: string;
  redirect: string;
  challenge: string;
  state: string;
  scope: string;
  expires: number;
};
const consentLifetimeSeconds = 15 * 60;

// No password, token, browser identifier or OAuth state is echoed in an error.
function consentPage(
  res: ServerResponse,
  status: number,
  message = "",
  consentId?: string,
  callbackOrigin?: string,
) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      // Browsers also apply form-action to the redirect after a form POST.
      // The password is posted only to /authorize; ChatGPT receives a GET
      // containing a short-lived code. Its exact callback is checked below.
      `default-src 'none'; form-action 'self' ${callbackOrigin || ""}; frame-ancestors 'none'`,
    "X-Content-Type-Options": "nosniff",
    // HTML form POSTs under no-referrer send Origin: null in browsers.
    // strict-origin preserves our CSRF check without disclosing query/state.
    "Referrer-Policy": "strict-origin",
  });
  res.end(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Autoriser Zotero Cloud</title><h1>Autoriser votre connecteur personnel</h1>
    ${message ? `<p role="alert">${message}</p>` : ""}
    ${consentId ? `<p>Cette connexion autorise la lecture et les outils d’ajout/enrichissement. Les écritures restent soumises au réglage du serveur. Aucune suppression.</p><p>Utilisez le mot de passe OWNER_PASSWORD enregistré dans Render. La demande reste valable 15 minutes.</p><form method="post" action="/authorize"><input type="hidden" name="consent" value="${consentId}"><p><label>Mot de passe du connecteur <input type="password" name="password" autocomplete="current-password" required autofocus></label></p><button>Autoriser ChatGPT</button></form>` : "<p>Fermez cette fenêtre, puis relancez la connexion du MCP dans ChatGPT.</p>"}
    </html>`);
}

export class OwnerAuth {
  config: AuthConfig;
  private signing: Uint8Array;
  private pending = new Map<string, Grant>();
  private codes = new Map<string, Grant>();
  private attempts: number[] = [];
  constructor(config: AuthConfig) {
    this.config = config;
    this.signing = new TextEncoder().encode(config.secret);
  }
  get resource() {
    return this.config.publicUrl + "/mcp";
  }
  challenge(res: ServerResponse) {
    res.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${this.config.publicUrl}/.well-known/oauth-protected-resource"`,
    );
    json(res, 401, { error: "unauthorized" });
  }
  async verify(header: string | undefined) {
    if (!header?.startsWith("Bearer ")) return false;
    try {
      const { payload } = await jwtVerify(header.slice(7), this.signing, {
        algorithms: ["HS256"],
        issuer: this.config.publicUrl,
        audience: this.resource,
      });
      return (
        payload.sub === "owner" && payload.scope === "zotero:read zotero:write"
      );
    } catch {
      return false;
    }
  }
  clean() {
    for (const map of [this.pending, this.codes])
      for (const [k, g] of map) if (g.expires < Date.now()) map.delete(k);
  }
  async handle(req: IncomingMessage, res: ServerResponse, url: URL) {
    const c = this.config;
    if (
      url.pathname === "/.well-known/oauth-protected-resource" ||
      url.pathname === "/.well-known/oauth-protected-resource/mcp"
    ) {
      json(res, 200, {
        resource: this.resource,
        authorization_servers: [c.publicUrl],
        scopes_supported: ["zotero:read", "zotero:write"],
      });
      return true;
    }
    if (url.pathname === "/.well-known/oauth-authorization-server") {
      json(res, 200, {
        issuer: c.publicUrl,
        authorization_endpoint: c.publicUrl + "/authorize",
        token_endpoint: c.publicUrl + "/token",
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        token_endpoint_auth_methods_supported: ["none"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: ["zotero:read", "zotero:write"],
        authorization_response_iss_parameter_supported: true,
      });
      return true;
    }
    if (url.pathname === "/authorize" && req.method === "GET") {
      this.clean();
      const q = url.searchParams;
      if (
        q.get("client_id") !== c.clientId ||
        q.get("redirect_uri") !== c.redirectUri ||
        q.get("response_type") !== "code" ||
        q.get("code_challenge_method") !== "S256" ||
        !/^[\w-]{43}$/.test(q.get("code_challenge") || "") ||
        q.get("resource") !== this.resource ||
        (q.get("state") || "").length > 2048 ||
        this.pending.size >= 100
      ) {
        json(res, 400, { error: "invalid_request" });
        return true;
      }
      const scopes = (q.get("scope") || "").split(" ").filter(Boolean);
      if (scopes.some((s) => !["zotero:read", "zotero:write"].includes(s))) {
        json(res, 400, { error: "invalid_scope" });
        return true;
      }
      const id = random();
      this.pending.set(id, {
        client: c.clientId,
        redirect: c.redirectUri,
        challenge: q.get("code_challenge")!,
        state: q.get("state") || "",
        scope: "zotero:read zotero:write",
        expires: Date.now() + consentLifetimeSeconds * 1000,
      });
      res.setHeader(
        "Set-Cookie",
        `zotero_consent=${id}; HttpOnly; SameSite=Lax; Path=/authorize; Max-Age=${consentLifetimeSeconds}${c.publicUrl.startsWith("https:") ? "; Secure" : ""}`,
      );
      consentPage(res, 200, "", id, new URL(c.redirectUri).origin);
      return true;
    }
    if (url.pathname === "/authorize" && req.method === "POST") {
      this.clean();
      this.attempts = this.attempts.filter((t) => t > Date.now() - 60000);
      if (this.attempts.length >= 5) {
        res.setHeader("Retry-After", "60");
        consentPage(
          res,
          429,
          "Trop de tentatives. Attendez une minute, puis relancez la connexion depuis ChatGPT.",
        );
        return true;
      }
      this.attempts.push(Date.now());
      const form = new URLSearchParams(await readBody(req, 8192)),
        id = form.get("consent") || "";
      const cookie = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("zotero_consent="))
        ?.slice("zotero_consent=".length);
      const grant = this.pending.get(id);
      if (req.headers.origin !== c.publicUrl) {
        consentPage(
          res,
          403,
          "Origine du formulaire non reconnue. Le navigateur n’a pas transmis l’origine attendue ; aucune autorisation n’a été accordée.",
        );
        return true;
      }
      if (!grant) {
        consentPage(
          res,
          403,
          "La demande a expiré, a déjà été utilisée ou le serveur a redémarré. Ce message ne signifie pas que votre mot de passe est incorrect.",
        );
        return true;
      }
      if (cookie !== id) {
        consentPage(
          res,
          403,
          "La session du navigateur est absente ou ne correspond plus au formulaire. Gardez la fenêtre de connexion ouverte et autorisez les cookies pour ce site.",
        );
        return true;
      }
      if (!equal(form.get("password") || "", c.password)) {
        consentPage(
          res,
          403,
          "Le mot de passe ne correspond pas à OWNER_PASSWORD sur Render. Réessayez ci-dessous ; aucun accès n’a été accordé.",
          id,
          new URL(c.redirectUri).origin,
        );
        return true;
      }
      this.pending.delete(id);
      const code = random();
      this.codes.set(code, { ...grant, expires: Date.now() + 60000 });
      const redirect = new URL(grant.redirect);
      redirect.searchParams.set("code", code);
      redirect.searchParams.set("state", grant.state);
      redirect.searchParams.set("iss", c.publicUrl);
      res.writeHead(302, {
        Location: redirect.toString(),
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Set-Cookie": `zotero_consent=; HttpOnly; SameSite=Lax; Path=/authorize; Max-Age=0${c.publicUrl.startsWith("https:") ? "; Secure" : ""}`,
      });
      res.end();
      return true;
    }
    if (url.pathname === "/token" && req.method === "POST") {
      this.clean();
      const f = new URLSearchParams(await readBody(req, 8192)),
        code = f.get("code") || "",
        grant = this.codes.get(code);
      const verifier = f.get("code_verifier") || "";
      if (
        !grant ||
        f.get("grant_type") !== "authorization_code" ||
        f.get("client_id") !== grant.client ||
        f.get("redirect_uri") !== grant.redirect ||
        f.get("resource") !== this.resource ||
        !/^[\w.~-]{43,128}$/.test(verifier) ||
        !equal(
          createHash("sha256").update(verifier).digest("base64url"),
          grant.challenge,
        )
      ) {
        json(res, 400, { error: "invalid_grant" });
        return true;
      }
      this.codes.delete(code);
      const access = await new SignJWT({ scope: grant.scope })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer(c.publicUrl)
        .setAudience(this.resource)
        .setSubject("owner")
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(this.signing);
      json(res, 200, {
        access_token: access,
        token_type: "Bearer",
        expires_in: 28800,
        scope: grant.scope,
      });
      return true;
    }
    return false;
  }
}
