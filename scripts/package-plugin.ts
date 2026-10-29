/** Generate a personal plugin package from public identifiers only. */
import { parseArgs } from "node:util";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const { values } = parseArgs({
  options: {
    url: { type: "string" },
    "app-id": { type: "string" },
    out: { type: "string" },
    archive: { type: "boolean", default: false },
  },
  strict: true,
});
if (!values.url || !values["app-id"]) {
  console.error(
    "Utilisation : npm run package:plugin -- --url https://ton-service.onrender.com --app-id asdk_app_IDENTIFIANT_VERIFIE [--archive]",
  );
  process.exit(1);
}
let url: URL;
try {
  url = new URL(values.url);
} catch {
  throw new Error("URL HTTPS du serveur attendue, sans secret ou paramètre.");
}
if (
  url.protocol !== "https:" ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  !["/", "/mcp"].includes(url.pathname)
)
  throw new Error("URL HTTPS du serveur attendue, sans secret ou paramètre.");
if (!/^asdk_app_[a-f0-9]{32}$/.test(values["app-id"]))
  throw new Error(
    "Copie l’identifiant réel de ton application depuis sa page de détails ChatGPT.",
  );
url.pathname = "/mcp";
const root = resolve(values.out || "dist/zotero-cloud");
try {
  await access(root);
  throw new Error(
    "Le dossier de destination existe déjà. Choisis --out avec un nouveau dossier.",
  );
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
const template = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../plugin-template",
);
const manifest = JSON.parse(
  await readFile(resolve(template, "plugin.json"), "utf8"),
);
const security = {
  auth: {
    type: "oauth",
    client: {
      mode: "provided",
      clientId: "zotero-cloud-personal",
      tokenEndpointAuthMethod: "none",
    },
    baseScopes: ["zotero:read", "zotero:write"],
    defaultScopes: ["zotero:read", "zotero:write"],
    oidcEnabled: false,
  },
};
const config = {
  $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  mcpServers: {
    "zotero-cloud": {
      type: "streamable-http",
      url: url.href,
      extensions: { "com.openai": security },
    },
  },
};
await mkdir(resolve(root, "skills/zotero-library"), { recursive: true });
for (const [path, data] of Object.entries({
  "plugin.json": JSON.stringify(manifest, null, 2),
  "mcp.json": JSON.stringify(config, null, 2),
  ".app.json": JSON.stringify(
    { apps: { "zotero-cloud": { id: values["app-id"] } } },
    null,
    2,
  ),
  "skills/zotero-library/SKILL.md": await readFile(
    resolve(template, "skills/zotero-library/SKILL.md"),
    "utf8",
  ),
}))
  await writeFile(resolve(root, path), data + "\n", { mode: 0o600 });
console.log(
  "Paquet personnel créé. Il contient uniquement l’adresse publique et l’identifiant de connexion, jamais les clés ou mots de passe.",
);
if (values.archive) {
  await promisify(execFile)("tar", [
    "-czf",
    root + ".tar.gz",
    "-C",
    dirname(root),
    root.split(/[\\/]/).at(-1)!,
  ]);
  console.log("Archive : " + root + ".tar.gz");
}
