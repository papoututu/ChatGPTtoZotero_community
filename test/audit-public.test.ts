import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { findings } from "../scripts/audit-public.ts";
const exec = promisify(execFile);
test("a publication audit accepts an empty example, rejects private environment files", () => {
  assert.deepEqual(findings(".env.example", "ZOTERO_API_KEY=\n"), []);
  assert(findings(".env", "ZOTERO_API_KEY=hidden-value").length);
});
test("history inspection finds a removed credential without printing its value", async () => {
  const temp = await mkdtemp(join(tmpdir(), "zotero-audit-"));
  const token = "ghp_" + "A".repeat(36);
  try {
    const git = (args: string[]) => exec("git", args, { cwd: temp });
    await git(["init", "-q"]);
    await git(["config", "user.name", "Audit Test"]);
    await git(["config", "user.email", "audit@example.invalid"]);
    await writeFile(join(temp, "credentials.txt"), token);
    await git(["add", "."]);
    await git(["commit", "-qm", "fixture"]);
    await git(["rm", "credentials.txt"]);
    await git(["commit", "-qm", "remove fixture"]);
    try {
      await exec(process.execPath, [
        resolve("scripts/audit-public.ts"),
        "--root",
        temp,
        "--history",
      ]);
      assert.fail("Audit should reject historical credential");
    } catch (e: any) {
      assert.match(e.stdout, /possible GitHub token/);
      assert(!e.stdout.includes(token));
      assert(!e.stderr.includes(token));
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
