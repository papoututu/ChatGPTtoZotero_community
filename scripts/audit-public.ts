/** Publication preflight: report file locations, never matched credential values. */
import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify, parseArgs } from "node:util";
const exec = promisify(execFile);
export function findings(path: string, text: string): string[] {
  const result: string[] = [];
  if (/(^|\/)\.env(?:\..+)?$/.test(path) && !path.endsWith(".env.example"))
    result.push("private environment file");
  if (
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/.test(text)
  )
    result.push("possible GitHub token");
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))
    result.push("private key");
  if (/\bAKIA[A-Z0-9]{16}\b/.test(text))
    result.push("possible cloud access key");
  for (const line of text.split("\n")) {
    const match = line.match(
      /^\s*(?:export\s+)?(?:ZOTERO_API_KEY|AUTH_SIGNING_SECRET|OWNER_PASSWORD)\s*=\s*["']?([^\s"'#]+)/,
    );
    if (match && !/^(?:mock|test|example|YOUR_|TON_|<|\$)/i.test(match[1]))
      result.push("nonempty credential assignment");
  }
  return [...new Set(result)];
}
async function run() {
  const { values } = parseArgs({
    options: {
      root: { type: "string" },
      history: { type: "boolean", default: false },
    },
    strict: true,
  });
  const root = resolve(values.root || ".");
  const issues: { path: string; type: string; commit?: string }[] = [];
  let checked = 0;
  async function check(path: string, content: string, commit?: string) {
    checked++;
    for (const type of findings(path, content))
      issues.push({
        path,
        type,
        ...(commit ? { commit: commit.slice(0, 12) } : {}),
      });
  }
  if (values.history) {
    const { stdout } = await exec("git", ["log", "--all", "--format=%H"], {
      cwd: root,
      maxBuffer: 8 * 1024 * 1024,
    });
    const commits = [...new Set(stdout.trim().split("\n").filter(Boolean))];
    const seen = new Set<string>();
    if (!commits.length) throw Error("No Git history to inspect.");
    for (const commit of commits) {
      const listing = await exec(
        "git",
        ["ls-tree", "-rz", "--full-tree", commit],
        { cwd: root, maxBuffer: 16 * 1024 * 1024 },
      );
      for (const entry of listing.stdout.split("\0").filter(Boolean)) {
        const tab = entry.indexOf("\t");
        const [mode, type, sha] = entry.slice(0, tab).split(" ");
        const path = entry.slice(tab + 1);
        if (type !== "blob" || mode === "120000" || seen.has(sha + " " + path))
          continue;
        seen.add(sha + " " + path);
        const blob = await exec("git", ["cat-file", "blob", sha], {
          cwd: root,
          maxBuffer: 16 * 1024 * 1024,
        });
        if (!blob.stdout.includes("\0")) await check(path, blob.stdout, commit);
      }
    }
  } else {
    async function walk(dir: string) {
      for (const item of await readdir(dir, { withFileTypes: true })) {
        if (
          [".git", "node_modules", "dist", "coverage"].includes(item.name) ||
          item.isSymbolicLink()
        )
          continue;
        const p = join(dir, item.name);
        if (item.isDirectory()) await walk(p);
        else {
          const text = await readFile(p, "utf8");
          if (!text.includes("\0")) await check(p.slice(root.length + 1), text);
        }
      }
    }
    await walk(root);
  }
  console.log(
    JSON.stringify(
      {
        scope: values.history ? "reachable Git history" : "working files",
        checked,
        findings: issues,
      },
      null,
      2,
    ),
  );
  console.log(
    "Heuristic preflight only: review findings and hosting/Actions logs before making a repository public. No credential values are printed.",
  );
  if (issues.length) process.exitCode = 1;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  run().catch(() => {
    console.error(
      "Publication audit could not complete. No publication readiness is established.",
    );
    process.exitCode = 1;
  });
