/** Render paired English/French documentation from reviewed bilingual sources. */
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
export type Section = {
  id: string;
  en: string;
  fr: string;
  reviewedPair: string;
};
type Document = {
  id: string;
  outputs: { en: string; fr: string };
  sections: Section[];
  navigation?: boolean;
};
export const pairHash = (s: Pick<Section, "en" | "fr">) =>
  createHash("sha256")
    .update(s.en + "\0" + s.fr)
    .digest("hex");
const vars = (text: string) =>
  [...new Set(text.match(/\{\{[^}]+\}\}/g) || [])].sort();
const code = (text: string) =>
  [...text.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1]);
const technical = (text: string) =>
  [
    ...new Set(
      text.match(
        /\b(?:ZOTERO_USER_ID|ZOTERO_API_KEY|OWNER_PASSWORD|WRITE_ENABLED|AUTH_SIGNING_SECRET|PUBLIC_URL|RENDER_EXTERNAL_URL|PORT|OAUTH_CLIENT_ID|OAUTH_REDIRECT_URI|NODE_VERSION|WRITES_DISABLED|AUTH_REQUIRED|VERSION_CONFLICT|PROBABLE_DUPLICATE|RATE_LIMIT)\b/g,
      ) || [],
    ),
  ].sort();
export function validateSection(s: Section) {
  if (!s.id || !s.en?.trim() || !s.fr?.trim())
    throw Error("Missing English or French text: " + s.id);
  for (const [name, a, b] of [
    ["shared variables", vars(s.en), vars(s.fr)],
    ["commands", code(s.en), code(s.fr)],
    ["technical identifiers", technical(s.en), technical(s.fr)],
    [
      "heading levels",
      s.en.match(/^#{1,6}(?= )/gm) || [],
      s.fr.match(/^#{1,6}(?= )/gm) || [],
    ],
  ] as const)
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw Error(`English/French ${name} differ in ${s.id}`);
  if (s.reviewedPair !== pairHash(s))
    throw Error(
      `Translation pair needs review: ${s.id}. Update both texts as needed, then run npm run docs:build -- --review.`,
    );
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function outputPath(path: string) {
  const p = resolve(root, path);
  if (p === root || !p.startsWith(root + sep))
    throw Error("Unsafe documentation path");
  return p;
}
const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
async function run() {
  const check = process.argv.includes("--check"),
    review = process.argv.includes("--review");
  if (check && review) throw Error("Use either --check or --review.");
  const facts = JSON.parse(
    await readFile(resolve(root, "docs/source/facts.json"), "utf8"),
  );
  const files = (await readdir(resolve(root, "docs/source")))
    .filter(
      (f) =>
        f.endsWith(".json") &&
        !["facts.json", "illustrations.json"].includes(f),
    )
    .sort();
  const documents: Document[] = [];
  for (const file of files) {
    const p = resolve(root, "docs/source", file),
      doc: Document = JSON.parse(await readFile(p, "utf8"));
    if (review) {
      for (const s of doc.sections) s.reviewedPair = pairHash(s);
      await writeFile(p, JSON.stringify(doc, null, 2) + "\n");
    }
    for (const s of doc.sections) validateSection(s);
    if (new Set(doc.sections.map((s) => s.id)).size !== doc.sections.length)
      throw Error("Repeated section ID: " + doc.id);
    documents.push(doc);
  }
  const byId = new Map(documents.map((d) => [d.id, d]));
  if (byId.size !== documents.length) throw Error("Repeated document ID");
  const changes: string[] = [];
  async function emit(path: string, text: string) {
    const target = outputPath(path);
    let old = "";
    try {
      old = await readFile(target, "utf8");
    } catch {}
    if (old === text) return;
    if (check) {
      changes.push(path);
      return;
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  }
  const imagePaths = {
    render: {
      en: "docs/images/render-settings.svg",
      fr: "docs/images/render-settings.fr.svg",
    },
    mcp: {
      en: "docs/images/mcp-connection.svg",
      fr: "docs/images/mcp-connection.fr.svg",
    },
  };
  function expand(text: string, lang: "en" | "fr", from: string) {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
      if (key.startsWith("doc:")) {
        const target = byId.get(key.slice(4));
        if (!target) throw Error("Unknown document: " + key);
        return relative(
          dirname(outputPath(from)),
          outputPath(target.outputs[lang]),
        )
          .split(sep)
          .join("/");
      }
      if (key.startsWith("image:")) {
        const target = imagePaths[key.slice(6) as keyof typeof imagePaths];
        if (!target) throw Error("Unknown image");
        return relative(dirname(outputPath(from)), outputPath(target[lang]))
          .split(sep)
          .join("/");
      }
      if (!(key in facts)) throw Error("Unknown shared fact: " + key);
      return String(facts[key]);
    });
  }
  for (const d of documents)
    for (const lang of ["en", "fr"] as const) {
      const from = d.outputs[lang];
      const other = relative(
        dirname(outputPath(from)),
        outputPath(d.outputs[lang === "en" ? "fr" : "en"]),
      )
        .split(sep)
        .join("/");
      const nav =
        d.navigation === false
          ? ""
          : `[${lang === "en" ? "English" : "Français"}](${from.split("/").at(-1)}) · [${lang === "en" ? "Français" : "English"}](${other})\n\n`;
      const body = d.sections
        .map(
          (s) =>
            (d.navigation === false ? "" : `<a id="${s.id}"></a>\n\n`) +
            expand(s[lang], lang, from).trim(),
        )
        .join("\n\n");
      await emit(from, nav + body + "\n");
    }
  const illustrations = JSON.parse(
    await readFile(resolve(root, "docs/source/illustrations.json"), "utf8"),
  );
  for (const [key, item] of Object.entries(illustrations) as [
    keyof typeof imagePaths,
    any,
  ][]) {
    for (const lang of ["en", "fr"] as const) {
      const labels = item[lang],
        height = 150 + item.rows.length * 64;
      const rows = item.rows
        .map((label: string, i: number) => {
          const y = 90 + i * 64;
          return `<rect x="25" y="${y}" width="870" height="52" rx="7" fill="white" stroke="#aeb8c8"/><text x="40" y="${y + 32}" font-family="monospace" font-size="17">${escape(label)}</text><text x="390" y="${y + 32}" font-family="monospace" font-size="17">${escape(expand(labels.values[i], lang, imagePaths[key][lang]))}</text>`;
        })
        .join("");
      if (labels.values.length !== item.rows.length)
        throw Error("Missing illustration translation");
      await emit(
        imagePaths[key][lang],
        `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="${height}" viewBox="0 0 920 ${height}" role="img" aria-labelledby="title desc"><title id="title">${escape(labels.title)}</title><desc id="desc">${escape(labels.note)}</desc><rect width="920" height="${height}" rx="16" fill="#f4f6fa"/><g font-family="Arial,sans-serif" fill="#19283d"><text x="30" y="40" font-size="23" font-weight="bold">${escape(labels.title)}</text><text x="30" y="69" font-size="15">${escape(labels.example)}</text>${rows}<text x="30" y="${height - 20}" font-size="15">${escape(labels.note)}</text></g></svg>\n`,
      );
    }
  }
  if (changes.length)
    throw Error(
      "Generated documentation is stale: " +
        changes.join(", ") +
        ". Run npm run docs:build.",
    );
  console.log(
    `${documents.length} English/French document pairs ${check ? "checked" : "generated"}; shared variables, commands, structure and reviewed pairs checked.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  run().catch((e) => {
    console.error((e as Error).message);
    process.exitCode = 1;
  });
