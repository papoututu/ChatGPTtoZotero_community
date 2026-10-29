import { AppError } from "./errors.ts";
export type CredentialProvider = () => Promise<{
  userId: string;
  apiKey: string;
}>;
export class Zotero {
  credentials: CredentialProvider;
  fetcher: typeof fetch;
  blockedUntil = 0;
  constructor(credentials: CredentialProvider, fetcher: typeof fetch = fetch) {
    this.credentials = credentials;
    this.fetcher = fetcher;
  }
  async request(
    path: string,
    method = "GET",
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<any> {
    if (!["GET", "POST", "PATCH"].includes(method))
      throw new AppError("FORBIDDEN", "Méthode non autorisée.");
    if (Date.now() < this.blockedUntil)
      throw new AppError("RATE_LIMIT", "Zotero demande une pause.", {
        retryAfterSeconds: Math.ceil((this.blockedUntil - Date.now()) / 1000),
      });
    const c = await this.credentials();
    if (!/^\d+$/.test(c.userId) || !c.apiKey)
      throw new AppError(
        "AUTH_REQUIRED",
        "Configurez l’autorisation Zotero côté serveur.",
      );
    // API destination fixed: neither tools nor Zotero content can supply a URL.
    const endpoint =
      path.startsWith("/items/new?") || path.startsWith("/itemType")
        ? path
        : `/users/${c.userId}${path}`;
    let r: Response;
    try {
      r = await this.fetcher(`https://api.zotero.org${endpoint}`, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Zotero-API-Version": "3",
          "Zotero-API-Key": c.apiKey,
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new AppError(
        "TEMPORARY_ERROR",
        "Zotero est injoignable ou le délai est dépassé. Vérifiez l’état avant de répéter une écriture.",
      );
    }
    const pause = Number(
      r.headers.get("Backoff") || r.headers.get("Retry-After") || 0,
    );
    if (pause > 0) this.blockedUntil = Date.now() + pause * 1000;
    if (!r.ok) {
      const mapping: Record<number, [string, string]> = {
        401: ["AUTH_REQUIRED", "Autorisation Zotero expirée ou révoquée."],
        403: [
          "LIBRARY_INACCESSIBLE",
          "Bibliothèque inaccessible ou droits insuffisants.",
        ],
        404: ["NOT_FOUND", "Notice ou collection introuvable."],
        409: ["LIBRARY_LOCKED", "Bibliothèque temporairement verrouillée."],
        412: [
          "VERSION_CONFLICT",
          "La notice ou bibliothèque a changé. Relisez-la avant de modifier.",
        ],
        429: [
          "RATE_LIMIT",
          "Limite Zotero atteinte. Réessayez après la pause.",
        ],
      };
      const [code, message] = mapping[r.status] || [
        r.status >= 500 ? "TEMPORARY_ERROR" : "INVALID_DATA",
        r.status >= 500
          ? "Erreur temporaire de Zotero."
          : "Zotero refuse les données bibliographiques.",
      ];
      if (r.status === 429 && !pause) this.blockedUntil = Date.now() + 60000;
      throw new AppError(code, message, {
        status: r.status,
        retryAfterSeconds: pause || undefined,
      });
    }
    const data = r.status === 204 ? null : await r.json();
    return {
      data,
      version: Number(r.headers.get("Last-Modified-Version") || 0),
    };
  }
  async all(path: string): Promise<{ items: any[]; version: number }> {
    const items: any[] = [];
    let libraryVersion: number | undefined;
    for (let start = 0; start < 100000; start += 100) {
      const result = await this.request(
        `${path}${path.includes("?") ? "&" : "?"}limit=100&start=${start}`,
      );
      if (libraryVersion !== undefined && result.version !== libraryVersion)
        throw new AppError(
          "VERSION_CONFLICT",
          "La bibliothèque a changé pendant la lecture. Relancez la recherche.",
        );
      libraryVersion = result.version;
      if (!Array.isArray(result.data))
        throw new AppError("API_ERROR", "Réponse Zotero inattendue.");
      items.push(...result.data);
      if (result.data.length < 100)
        return { items, version: libraryVersion || 0 };
    }
    throw new AppError(
      "LIBRARY_TOO_LARGE",
      "Lecture incomplète : création bloquée pour éviter un doublon.",
    );
  }
}
