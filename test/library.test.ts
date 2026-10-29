import { test } from "node:test";
import assert from "node:assert/strict";
import { Library, doi, isbn, candidates } from "../src/library.ts";
import { Zotero } from "../src/zotero.ts";
import type { Item } from "../src/schemas.ts";
import { schemas } from "../src/schemas.ts";
function fixture(initial: Item[] = []) {
  const items = structuredClone(initial),
    calls: { path: string; method: string; body: any; headers: Headers }[] = [];
  let libraryVersion = 10;
  let fail = 0;
  const fetcher: typeof fetch = async (input, init) => {
    const u = new URL(String(input)),
      path = u.pathname.replace("/users/123", ""),
      method = init?.method || "GET",
      body = init?.body ? JSON.parse(String(init.body)) : undefined,
      headers = new Headers(init?.headers);
    calls.push({ path, method, body, headers });
    const respond = (data: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(data), {
        status,
        headers: { "Last-Modified-Version": String(libraryVersion) },
      });
    if (fail) {
      const s = fail;
      fail = 0;
      return respond({}, s);
    }
    if (path === "/items/new")
      return respond({
        itemType: u.searchParams.get("itemType"),
        title: "",
        creators: [],
        date: "",
        DOI: "",
        ISBN: "",
        edition: "",
        language: "",
        publicationTitle: "",
        publisher: "",
        tags: [],
        collections: [],
        relations: {},
      });
    if (path === "/itemTypeCreatorTypes")
      return respond([{ creatorType: "author" }, { creatorType: "editor" }]);
    if (path === "/collections")
      return respond([{ key: "COLLECT1", data: { name: "Soutenance" } }]);
    if (path === "/collections/COLLECT1")
      return respond({ key: "COLLECT1", data: { name: "Soutenance" } });
    if (
      method === "GET" &&
      (path === "/items/top" || path.endsWith("/children"))
    ) {
      const list = path.endsWith("/children")
        ? items.filter((i) => i.data.parentItem === path.split("/")[2])
        : items.filter((i) => !i.data.parentItem);
      return respond(
        list.slice(
          Number(u.searchParams.get("start") || 0),
          Number(u.searchParams.get("start") || 0) + 100,
        ),
      );
    }
    if (method === "POST") {
      const expected = headers.get("If-Unmodified-Since-Version");
      if (expected && Number(expected) !== libraryVersion)
        return respond({}, 412);
      const key = "NEWITEM" + items.length.toString().slice(-1);
      const item = { key, version: ++libraryVersion, data: body[0] };
      items.push(item);
      return respond({ successful: { "0": item }, failed: {} });
    }
    const item = items.find((i) => i.key === path.split("/")[2]);
    if (!item) return respond({}, 404);
    if (method === "PATCH") {
      if (Number(headers.get("If-Unmodified-Since-Version")) !== item.version)
        return respond({}, 412);
      Object.assign(item.data, body);
      item.version = ++libraryVersion;
      return respond(null, 204);
    }
    return respond(item);
  };
  const api = new Zotero(
    async () => ({ userId: "123", apiKey: "mock-secret" }),
    fetcher,
  );
  return {
    library: new Library(api, true),
    items,
    calls,
    api,
    failNext: (status: number) => {
      fail = status;
    },
  };
}
const book: Item = {
  key: "ABCDEFGH",
  version: 3,
  data: {
    itemType: "book",
    title: "Sociologie de l’expérience",
    date: "1994",
    creators: [
      { creatorType: "author", firstName: "François", lastName: "Dubet" },
    ],
    tags: [{ tag: "ancien", type: 1 }],
    collections: ["EXISTING"],
  },
};
const article: Item = {
  key: "ARTICLE1",
  version: 4,
  data: {
    itemType: "journalArticle",
    title: "An article",
    DOI: "https://doi.org/10.1234/TEST",
    creators: [],
    date: "2020",
  },
};
const fields = {
  title: "Titre vérifié",
  date: "2023",
  creators: [{ creatorType: "author", lastName: "Gardien" }],
};
const requestId = "1234567890abcdef";
test("recherche DOI normalisé", async () => {
  const f = fixture([article]);
  const r = await f.library.run("search_items", { DOI: "doi:10.1234/test" });
  assert.equal(r.items[0].key, "ARTICLE1");
  assert.equal(doi("https://doi.org/10.1/ABC"), "10.1/abc");
});
test("recherche titre auteur sans accents", async () => {
  const f = fixture([book]);
  assert.equal(
    (
      await f.library.run("search_items", {
        title: "sociologie de l experience",
        author: "Dubet",
        year: "1994",
      })
    ).items.length,
    1,
  );
});
test("doublon et ambiguïté bloquent la création sans POST", async () => {
  const f = fixture([book]);
  await assert.rejects(
    f.library.run("create_item", {
      itemType: "book",
      fields: {
        ...book.data,
        title: book.data.title,
        creators: book.data.creators,
        date: "1994",
        tags: undefined,
        collections: undefined,
      },
      requestId,
    }),
  );
  const clean = {
    title: book.data.title,
    date: "2000",
    creators: fields.creators,
  };
  await assert.rejects(
    f.library.run("create_item", {
      itemType: "book",
      fields: clean,
      requestId,
    }),
    { code: "PROBABLE_DUPLICATE" },
  );
  assert(!f.calls.some((c) => c.method === "POST"));
});
for (const itemType of ["journalArticle", "book"])
  test(`création ${itemType}`, async () => {
    const f = fixture();
    const item = await f.library.run("create_item", {
      itemType,
      fields,
      requestId,
    });
    assert.equal(item.data.itemType, itemType);
    const post = f.calls.find((c) => c.method === "POST")!;
    assert.equal(post.headers.get("Zotero-Write-Token"), requestId);
    assert.equal(post.headers.get("If-Unmodified-Since-Version"), "10");
  });
test("ajout tag préserve tags automatiques et existants", async () => {
  const f = fixture([book]);
  const r = await f.library.run("add_tags", {
    key: book.key,
    expectedVersion: 3,
    tags: ["nouveau", "ancien"],
  });
  assert.deepEqual(r.data.tags, [
    { tag: "ancien", type: 1 },
    { tag: "nouveau" },
  ]);
});
test("ajout collection préserve autres collections", async () => {
  const f = fixture([book]);
  const r = await f.library.run("add_to_collection", {
    key: book.key,
    expectedVersion: 3,
    collectionKey: "COLLECT1",
  });
  assert.deepEqual(r.data.collections, ["EXISTING", "COLLECT1"]);
});
test("note enfant structurée et HTML échappé, répétition sans duplication", async () => {
  const f = fixture([book]);
  const args = {
    key: book.key,
    text: "Recommandée par Ève Gardien.\n\n<script>Texte source</script>",
    requestId,
  };
  const r = await f.library.run("add_note", args);
  assert.equal(r.data.parentItem, book.key);
  assert.equal(
    r.data.note,
    "<p>Recommandée par Ève Gardien.</p><p>&lt;script&gt;Texte source&lt;/script&gt;</p>",
  );
  assert.equal((await f.library.run("add_note", args)).unchanged, true);
  assert.equal(f.calls.filter((c) => c.method === "POST").length, 1);
});
test("conflit détecté avant écriture et 412 explicite", async () => {
  const f = fixture([book]);
  await assert.rejects(
    f.library.run("add_tags", {
      key: book.key,
      expectedVersion: 2,
      tags: ["x"],
    }),
    { code: "VERSION_CONFLICT" },
  );
  f.failNext(412);
  await assert.rejects(f.api.request("/items/ABCDEFGH", "PATCH", {}, {}), {
    code: "VERSION_CONFLICT",
  });
});
test("aucun outil ni chemin de suppression y compris deleted", async () => {
  assert.equal(Object.keys(schemas).length, 8);
  assert(!Object.keys(schemas).some((n) => /delete|remove/.test(n)));
  const f = fixture([book]);
  await assert.rejects(f.api.request("/items/ABCDEFGH", "DELETE"), {
    code: "FORBIDDEN",
  });
  await assert.rejects(
    f.library.run("update_item", {
      key: book.key,
      expectedVersion: 3,
      fields: { deleted: "1" },
    }),
    { code: "INVALID_DATA" },
  );
  assert(!f.calls.some((c) => c.method === "PATCH"));
});
test("ne remplace pas une valeur contradictoire silencieusement", async () => {
  const f = fixture([book]);
  await assert.rejects(
    f.library.run("update_item", {
      key: book.key,
      expectedVersion: 3,
      fields: { title: "Autre titre" },
    }),
    { code: "CONTRADICTORY_METADATA" },
  );
  assert.equal(f.items[0].data.title, book.data.title);
});
test("enrichissement DOI manquant", async () => {
  const f = fixture([book]);
  const r = await f.library.run("update_item", {
    key: book.key,
    expectedVersion: 3,
    fields: { DOI: "10.1/test" },
  });
  assert.equal(r.data.DOI, "10.1/test");
});
test("auteur seul et paramètres inconnus refusés", async () => {
  const f = fixture();
  await assert.rejects(
    f.library.run("create_item", {
      itemType: "book",
      fields: { title: "Habermas" },
      requestId,
    }),
    { code: "INSUFFICIENT_METADATA" },
  );
  await assert.rejects(
    f.library.run("search_items", { query: "x", url: "https://evil.test" }),
    { code: "INVALID_INPUT" },
  );
});
test("éditions et types proches : candidats sans fusion automatique", () => {
  assert.equal(
    candidates({ ...book.data, itemType: "bookSection", date: "2004" }, [
      book,
    ])[0].automaticMerge,
    false,
  );
});
test("ISBN10 et ISBN13 concordent", () => {
  assert.deepEqual(isbn("0-306-40615-2"), isbn("9780306406157"));
});
test("pagination au-delà de 100 notices", async () => {
  const f = fixture(
    Array.from({ length: 101 }, (_, n) => ({
      ...book,
      key: String(n).padStart(8, "0"),
      data: { ...book.data, title: `Titre ${n}` },
    })),
  );
  assert.equal(
    (await f.library.run("search_items", { title: "Titre 100" })).items.length,
    1,
  );
});
for (const [status, code] of [
  [401, "AUTH_REQUIRED"],
  [403, "LIBRARY_INACCESSIBLE"],
  [404, "NOT_FOUND"],
  [429, "RATE_LIMIT"],
  [503, "TEMPORARY_ERROR"],
] as const)
  test(`erreur Zotero ${status}`, async () => {
    const f = fixture();
    f.failNext(status);
    await assert.rejects(f.api.request("/items"), { code });
  });
test("écritures désactivées par défaut", async () => {
  const f = fixture();
  const lib = new Library(f.api);
  await assert.rejects(
    lib.run("add_note", { key: book.key, text: "x", requestId }),
    { code: "WRITES_DISABLED" },
  );
  assert.equal(f.calls.length, 0);
});

test("DOI fort bloque même lorsque le titre diffère", async () => {
  const f = fixture([article]);
  await assert.rejects(
    f.library.run("create_item", {
      itemType: "journalArticle",
      fields: { ...fields, DOI: "doi:10.1234/test" },
      requestId,
    }),
    { code: "PROBABLE_DUPLICATE" },
  );
  assert(!f.calls.some((c) => c.method === "POST"));
});
test("ISBN fort bloque une édition candidate", async () => {
  const f = fixture([
    { ...book, data: { ...book.data, ISBN: "0-306-40615-2" } },
  ]);
  await assert.rejects(
    f.library.run("create_item", {
      itemType: "book",
      fields: { ...fields, ISBN: "9780306406157" },
      requestId,
    }),
    { code: "PROBABLE_DUPLICATE" },
  );
});
test("Backoff bloque les appels suivants sans relance aveugle", async () => {
  let calls = 0;
  const api = new Zotero(
    async () => ({ userId: "123", apiKey: "mock" }),
    async () => {
      calls++;
      return new Response("[]", { headers: { Backoff: "10" } });
    },
  );
  await api.request("/items");
  await assert.rejects(api.request("/items"), { code: "RATE_LIMIT" });
  assert.equal(calls, 1);
});
test("collection absente bloque l’ajout sans PATCH", async () => {
  const f = fixture([book]);
  await assert.rejects(
    f.library.run("add_to_collection", {
      key: book.key,
      expectedVersion: 3,
      collectionKey: "NOTFOUND",
    }),
    { code: "NOT_FOUND" },
  );
  assert(!f.calls.some((c) => c.method === "PATCH"));
});
