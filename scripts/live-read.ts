import { Zotero } from "../src/zotero.ts";
import { Library } from "../src/library.ts";
const api = new Zotero(async () => ({
  userId: process.env.ZOTERO_USER_ID || "",
  apiKey: process.env.ZOTERO_API_KEY || "",
}));
const library = new Library(api, false);
const collections = await library.run("get_collections", {});
console.log(
  `Lecture autorisée : ${collections.collections.length} collections. Aucun titre ni secret affiché.`,
);
const query = process.argv[2];
if (query) {
  const result = await library.run("search_items", { query });
  console.log(
    `Recherche complète : ${result.items.length} résultat(s). Aucune écriture.`,
  );
}
