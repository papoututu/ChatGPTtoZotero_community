// Local-only interactive setup. No secret is printed or sent to ChatGPT.
import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import { writeFile, access } from "node:fs/promises";
import { stdin, stdout } from "node:process";
try {
  await access(".env");
  console.error(".env existe déjà ; aucune modification.");
  process.exit(1);
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
const rl = createInterface({ input: stdin, output: stdout });
const userId = await rl.question("Identifiant numérique Zotero : ");
rl.close();
if (!/^\d+$/.test(userId)) throw new Error("Identifiant invalide.");
// API key is read silently via a TTY raw input handler.
async function hidden(prompt: string) {
  if (!stdin.isTTY) throw new Error("Un terminal interactif est nécessaire.");
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  let value = "";
  return new Promise<string>((resolve) => {
    const listener = (chunk: Buffer) => {
      for (const c of chunk.toString()) {
        if (c === "\u0003") process.exit(1);
        if (c === "\r" || c === "\n") {
          stdin.off("data", listener);
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (c === "\u007f") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", listener);
  });
}
const apiKey = await hidden("Clé API Zotero (saisie masquée) : ");
const password = await hidden(
  "Mot de passe personnel du connecteur (20 caractères minimum) : ",
);
if (!apiKey || password.length < 20 || /[\r\n]/.test(apiKey + password))
  throw new Error("Clé ou mot de passe invalide.");
const quote = (s: string) => JSON.stringify(s);
await writeFile(
  ".env",
  `PORT=8787\nPUBLIC_URL=http://localhost:8787\nZOTERO_USER_ID=${userId}\nZOTERO_API_KEY=${quote(apiKey)}\nWRITE_ENABLED=false\nAUTH_SIGNING_SECRET=${randomBytes(32).toString("hex")}\nOWNER_PASSWORD=${quote(password)}\nOAUTH_CLIENT_ID=zotero-cloud-personal\nOAUTH_REDIRECT_URI=https://chatgpt.com/connector_platform_oauth_redirect\n`,
  { mode: 0o600, flag: "wx" },
);
console.log("Configuration privée créée. Lancez npm start.");
