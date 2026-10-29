/** Public endpoint checks only. No credentials or Zotero data are requested. */
import { parseArgs } from "node:util";
const { values } = parseArgs({
  options: { url: { type: "string" } },
  strict: true,
});
if (!values.url) {
  console.error(
    "Utilisation : npm run doctor -- --url https://ton-service.onrender.com",
  );
  process.exit(1);
}
let base: URL;
try {
  base = new URL(values.url);
  if (
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    !["https:", "http:"].includes(base.protocol) ||
    (!["localhost", "127.0.0.1"].includes(base.hostname) &&
      base.protocol !== "https:")
  )
    throw Error();
  base.pathname = "/";
} catch {
  console.error(
    "Fournis une adresse HTTPS publique, sans secret, paramètre ou fragment.",
  );
  process.exit(1);
}
let failed = false;
for (const [path, label] of [
  ["/health", "Service en ligne"],
  ["/.well-known/oauth-protected-resource", "Ressource OAuth"],
  ["/.well-known/oauth-authorization-server", "Connexion OAuth / PKCE"],
  ["/mcp", "Protection des données"],
] as const) {
  try {
    const r = await fetch(new URL(path, base), {
      redirect: "error",
      signal: AbortSignal.timeout(70000),
    });
    let ok: boolean;
    if (path === "/mcp")
      ok =
        r.status === 401 &&
        !!r.headers.get("WWW-Authenticate")?.includes("resource_metadata=");
    else {
      const data = await r.json();
      ok =
        r.ok &&
        (path === "/health"
          ? data.status === "ok"
          : path.includes("protected-resource")
            ? data.resource === new URL("/mcp", base).href
            : data.code_challenge_methods_supported?.includes("S256") &&
              data.authorization_endpoint ===
                new URL("/authorize", base).href &&
              data.token_endpoint === new URL("/token", base).href);
    }
    console.log(`${ok ? "OK" : "À VÉRIFIER"} — ${label}`);
    if (!ok) failed = true;
  } catch {
    failed = true;
    console.log(
      `À VÉRIFIER — ${label} : adresse inaccessible ou réponse inattendue. Vérifie le statut Live et réessaie après le réveil du service.`,
    );
  }
}
console.log(
  "Ce diagnostic ne teste pas ta clé Zotero et n’effectue aucune écriture.",
);
process.exitCode = failed ? 1 : 0;
