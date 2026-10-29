import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateSection, pairHash } from "../scripts/docs.ts";
import { readConfig } from "../src/config.ts";
const paired = () => {
  const s = {
    id: "example",
    en: "## Setup\n\nSet `WRITE_ENABLED` using {{ownerPasswordMin}}.\n\n```sh\nnpm start\n```",
    fr: "## Installation\n\nRégler `WRITE_ENABLED` avec {{ownerPasswordMin}}.\n\n```sh\nnpm start\n```",
    reviewedPair: "",
  };
  s.reviewedPair = pairHash(s);
  return s;
};
test("une section relue contient les deux langues et les mêmes commandes", () =>
  assert.doesNotThrow(() => validateSection(paired())));
test("une traduction manquante bloque la documentation", () => {
  const s = paired();
  s.fr = "";
  assert.throws(() => validateSection(s), /Missing English or French/);
});
test("une modification anglaise non relue ne passe pas silencieusement", () => {
  const s = paired();
  s.en += " Changed instruction.";
  assert.throws(() => validateSection(s), /needs review/);
});
test("une modification des paramètres ou commandes doit concerner les deux langues", () => {
  const s = paired();
  s.fr = s.fr.replace("WRITE_ENABLED", "OWNER_PASSWORD");
  s.reviewedPair = pairHash(s);
  assert.throws(() => validateSection(s), /technical identifiers/);
  const c = paired();
  c.fr = c.fr.replace("npm start", "npm run dev");
  c.reviewedPair = pairHash(c);
  assert.throws(() => validateSection(c), /commands/);
});
test("une variable partagée ne peut disparaître de la traduction", () => {
  const s = paired();
  s.fr = s.fr.replace("{{ownerPasswordMin}}", "20");
  s.reviewedPair = pairHash(s);
  assert.throws(() => validateSection(s), /shared variables/);
});
test("le seuil de mot de passe documenté correspond à la configuration réelle", async () => {
  const facts = JSON.parse(await readFile("docs/source/facts.json", "utf8"));
  const env = {
    ZOTERO_USER_ID: "123",
    ZOTERO_API_KEY: "mock-only",
    AUTH_SIGNING_SECRET: "x".repeat(facts.signingSecretMin),
    OWNER_PASSWORD: "x".repeat(facts.ownerPasswordMin),
  };
  assert.doesNotThrow(() => readConfig(env));
  assert.throws(
    () =>
      readConfig({
        ...env,
        OWNER_PASSWORD: "x".repeat(facts.ownerPasswordMin - 1),
      }),
    /OWNER_PASSWORD/,
  );
});
