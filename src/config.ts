/** Validate configuration without ever echoing a credential. */
export type Config = {
  publicUrl: string;
  port: number;
  userId: string;
  apiKey: string;
  writeEnabled: boolean;
  signingSecret: string;
  ownerPassword: string;
  clientId: string;
  redirectUri: string;
};
export function readConfig(env: NodeJS.ProcessEnv): Config {
  const errors: string[] = [];
  const rawUrl = (
    env.PUBLIC_URL ||
    env.RENDER_EXTERNAL_URL ||
    "http://localhost:8787"
  ).replace(/\/$/, "");
  let publicUrl = rawUrl;
  try {
    const u = new URL(rawUrl);
    if (
      u.pathname !== "/" ||
      u.search ||
      u.hash ||
      u.username ||
      u.password ||
      !["http:", "https:"].includes(u.protocol) ||
      (!["localhost", "127.0.0.1"].includes(u.hostname) &&
        u.protocol !== "https:")
    )
      throw Error();
    publicUrl = u.origin;
  } catch {
    errors.push(
      "PUBLIC_URL : origine HTTPS attendue, sans chemin. Sur Render, laisse ce paramètre absent : son adresse est détectée automatiquement.",
    );
  }
  const port = Number(env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    errors.push("PORT : nombre entier de 1 à 65535 attendu.");
  const userId = (env.ZOTERO_USER_ID || "").trim();
  if (!/^\d+$/.test(userId))
    errors.push(
      "ZOTERO_USER_ID : identifiant numérique indiqué sur zotero.org/settings/keys, pas le nom du compte.",
    );
  const apiKey = (env.ZOTERO_API_KEY || "").trim();
  if (!apiKey || /[\r\n]/.test(apiKey))
    errors.push(
      "ZOTERO_API_KEY : renseigne la clé dédiée dans les secrets du service Render.",
    );
  const ownerPassword = env.OWNER_PASSWORD || "";
  if (ownerPassword.length < 20)
    errors.push(
      "OWNER_PASSWORD : au moins 20 caractères. Choisis un mot de passe propre au connecteur.",
    );
  const signingSecret = env.AUTH_SIGNING_SECRET || "";
  if (signingSecret.length < 32)
    errors.push(
      "AUTH_SIGNING_SECRET : au moins 32 caractères. Ce secret est normalement généré par Render.",
    );
  const mode = (env.WRITE_ENABLED || "false").trim();
  if (!["true", "false"].includes(mode))
    errors.push(
      "WRITE_ENABLED : saisis exactement false (lecture seule) ou true (lecture et écriture), sans guillemets.",
    );
  const clientId = env.OAUTH_CLIENT_ID || "zotero-cloud-personal";
  const redirectUri =
    env.OAUTH_REDIRECT_URI ||
    "https://chatgpt.com/connector_platform_oauth_redirect";
  try {
    const u = new URL(redirectUri);
    if (
      u.origin !== "https://chatgpt.com" ||
      u.username ||
      u.password ||
      u.hash
    )
      throw Error();
  } catch {
    errors.push(
      "OAUTH_REDIRECT_URI : URL HTTPS ChatGPT exacte du parcours de connexion attendue.",
    );
  }
  if (errors.length)
    throw new Error("Configuration à compléter :\n- " + errors.join("\n- "));
  return {
    publicUrl,
    port,
    userId,
    apiKey,
    writeEnabled: mode === "true",
    signingSecret,
    ownerPassword,
    clientId,
    redirectUri,
  };
}
