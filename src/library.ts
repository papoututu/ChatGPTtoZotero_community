import { AppError } from "./errors.ts";
import { schemas } from "./schemas.ts";
import type { Item } from "./schemas.ts";
import type { Zotero } from "./zotero.ts";
export const normalize = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export const doi = (v: unknown) =>
  String(v ?? "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi\s*:\s*/i, "")
    .toLowerCase();
export function isbn(v: unknown) {
  return (String(v ?? "").match(/[\dXx][\dXx\s-]{8,}[\dXx]/g) || [])
    .map((s) => s.replace(/[^\dX]/gi, "").toUpperCase())
    .filter((s) => s.length === 10 || s.length === 13)
    .map((s) => {
      if (s.length === 13) return s;
      const p = "978" + s.slice(0, 9);
      return (
        p +
        ((10 -
          ([...p].reduce((sum, n, i) => sum + Number(n) * (i % 2 ? 3 : 1), 0) %
            10)) %
          10)
      );
    });
}
const year = (v: unknown) => String(v ?? "").match(/\b\d{4}\b/)?.[0];
const author = (d: Record<string, any>) =>
  normalize(d.creators?.[0]?.lastName || d.creators?.[0]?.name);
export function candidates(data: Record<string, any>, items: Item[]) {
  return items.flatMap((item) => {
    const d = item.data;
    const reasons: string[] = [];
    if (data.DOI && d.DOI && doi(data.DOI) === doi(d.DOI))
      reasons.push("DOI identique");
    if (isbn(data.ISBN).some((i) => isbn(d.ISBN).includes(i)))
      reasons.push("ISBN identique");
    const t = normalize(data.title),
      u = normalize(d.title);
    if (
      t &&
      u &&
      (t === u ||
        (t.length > 16 && u.length > 16 && (t.includes(u) || u.includes(t))))
    )
      reasons.push(
        "Titre identique ou proche ; édition/type/langue à examiner",
      );
    if (!reasons.length) return [];
    return [
      {
        ...item,
        matchReasons: reasons,
        metadataAgreement: {
          author: !!author(data) && author(data) === author(d),
          year: !!year(data.date) && year(data.date) === year(d.date),
        },
        automaticMerge: false,
      },
    ];
  });
}
export class Library {
  api: Zotero;
  writeEnabled: boolean;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(api: Zotero, writeEnabled = false) {
    this.api = api;
    this.writeEnabled = writeEnabled;
  }
  async run(name: keyof typeof schemas, input: unknown): Promise<any> {
    const parsed = schemas[name].safeParse(input);
    if (!parsed.success)
      throw new AppError(
        "INVALID_INPUT",
        "Paramètres invalides.",
        parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      );
    const write = !["search_items", "get_item", "get_collections"].includes(
      name,
    );
    if (write && !this.writeEnabled)
      throw new AppError(
        "WRITES_DISABLED",
        "Écritures désactivées côté serveur pendant la validation.",
      );
    if (!write) return this.execute(name, parsed.data);
    // Serialize local writers; Zotero version preconditions also protect across instances.
    const task = this.queue.then(() => this.execute(name, parsed.data));
    this.queue = task.catch(() => {});
    return task;
  }
  async item(key: string): Promise<Item> {
    return (await this.api.request(`/items/${key}`)).data;
  }
  async bibliographic(key: string) {
    const item = await this.item(key);
    if (["note", "attachment", "annotation"].includes(item.data.itemType))
      throw new AppError(
        "INVALID_DATA",
        "Cette opération nécessite une référence bibliographique.",
      );
    return item;
  }
  async validateFields(type: string, fields: Record<string, unknown>) {
    const template = (
      await this.api.request(`/items/new?itemType=${encodeURIComponent(type)}`)
    ).data;
    const forbidden = [
      "key",
      "version",
      "deleted",
      "parentItem",
      "itemType",
      "tags",
      "collections",
      "relations",
      "note",
    ];
    for (const name of Object.keys(fields))
      if (forbidden.includes(name) || !(name in template))
        throw new AppError(
          "INVALID_DATA",
          `Champ non autorisé pour ${type} : ${name}`,
        );
    if ("creators" in fields) {
      if (!Array.isArray(fields.creators))
        throw new AppError(
          "INVALID_DATA",
          "Les contributeurs doivent être une liste.",
        );
      const allowed = (
        await this.api.request(
          `/itemTypeCreatorTypes?itemType=${encodeURIComponent(type)}`,
        )
      ).data.map((c: any) => c.creatorType);
      if (fields.creators.some((c: any) => !allowed.includes(c.creatorType)))
        throw new AppError(
          "INVALID_DATA",
          "Type de contributeur incompatible avec le type de notice.",
        );
    }
    for (const [name, value] of Object.entries(fields))
      if (name !== "creators" && typeof value !== "string")
        throw new AppError(
          "INVALID_DATA",
          `Le champ ${name} doit être du texte.`,
        );
    return template;
  }
  async patch(item: Item, expected: number, fields: Record<string, unknown>) {
    if (item.version !== expected)
      throw new AppError(
        "VERSION_CONFLICT",
        "La notice a changé. Relisez-la.",
        { currentVersion: item.version },
      );
    await this.api.request(`/items/${item.key}`, "PATCH", fields, {
      "If-Unmodified-Since-Version": String(expected),
    });
    return this.item(item.key);
  }
  async create(
    data: Record<string, unknown>,
    requestId: string,
    libraryVersion?: number,
  ) {
    const result = await this.api.request("/items", "POST", [data], {
      "Zotero-Write-Token": requestId,
      ...(libraryVersion !== undefined
        ? { "If-Unmodified-Since-Version": String(libraryVersion) }
        : {}),
    });
    const failure = result.data.failed?.["0"];
    if (failure)
      throw new AppError(
        failure.code === 412 ? "VERSION_CONFLICT" : "WRITE_FAILED",
        "Zotero a refusé la création.",
        { status: failure.code },
      );
    const success = result.data.successful?.["0"];
    const key =
      success?.key ||
      result.data.success?.["0"] ||
      result.data.unchanged?.["0"];
    if (!key)
      throw new AppError(
        "WRITE_OUTCOME_UNKNOWN",
        "Résultat non confirmé. Recherchez la notice avant de réessayer.",
      );
    return success?.data ? success : this.item(key);
  }
  async execute(name: keyof typeof schemas, a: any): Promise<any> {
    switch (name) {
      case "search_items": {
        // Full paginated scan: Zotero q does not index DOI/ISBN reliably and cannot guarantee no duplicates.
        const snapshot = await this.api.all("/items/top");
        const found = snapshot.items.filter((i: Item) => {
          const d = i.data;
          if (["attachment", "note", "annotation"].includes(d.itemType))
            return false;
          return (
            (!a.DOI || doi(a.DOI) === doi(d.DOI)) &&
            (!a.ISBN || isbn(a.ISBN).some((n) => isbn(d.ISBN).includes(n))) &&
            (!a.title || normalize(d.title).includes(normalize(a.title))) &&
            (!a.author ||
              normalize(JSON.stringify(d.creators || [])).includes(
                normalize(a.author),
              )) &&
            (!a.year || year(d.date) === a.year) &&
            (!a.query ||
              normalize(JSON.stringify(d)).includes(normalize(a.query)))
          );
        });
        return {
          items: found,
          complete: true,
          libraryVersion: snapshot.version,
        };
      }
      case "get_item": {
        const item = await this.item(a.key);
        return {
          ...item,
          ...(a.includeNotes
            ? {
                notes: (
                  await this.api.all(`/items/${a.key}/children?itemType=note`)
                ).items,
              }
            : {}),
        };
      }
      case "get_collections": {
        const all = await this.api.all("/collections");
        return {
          collections: all.items.filter(
            (c) =>
              !a.name || normalize(c.data.name).includes(normalize(a.name)),
          ),
          complete: true,
        };
      }
      case "create_item": {
        if (
          typeof a.fields.title !== "string" ||
          !a.fields.title.trim() ||
          !Array.isArray(a.fields.creators) ||
          !a.fields.creators.length ||
          !year(a.fields.date)
        )
          throw new AppError(
            "INSUFFICIENT_METADATA",
            "Titre, contributeur et année vérifiés sont nécessaires. Une simple mention d’auteur ne suffit pas.",
          );
        const template = await this.validateFields(a.itemType, a.fields);
        for (const collection of a.collections)
          await this.api.request(`/collections/${collection}`);
        const snapshot = await this.api.all("/items/top");
        const duplicates = candidates(a.fields, snapshot.items);
        if (duplicates.length)
          throw new AppError(
            "PROBABLE_DUPLICATE",
            "Des références proches existent. Examinez-les et enrichissez la notice existante si approprié. La V1 bloque la création ambiguë.",
            { candidates: duplicates },
          );
        return this.create(
          {
            ...template,
            ...a.fields,
            itemType: a.itemType,
            tags: a.tags.map((tag: string) => ({ tag })),
            collections: a.collections,
          },
          a.requestId,
          snapshot.version,
        );
      }
      case "update_item": {
        if (!Object.keys(a.fields).length)
          throw new AppError("INVALID_INPUT", "Aucun champ à modifier.");
        const item = await this.bibliographic(a.key);
        await this.validateFields(item.data.itemType, a.fields);
        const conflicts = Object.keys(a.fields).filter(
          (k) =>
            item.data[k] !== undefined &&
            item.data[k] !== "" &&
            !(Array.isArray(item.data[k]) && !item.data[k].length) &&
            JSON.stringify(item.data[k]) !== JSON.stringify(a.fields[k]),
        );
        if (conflicts.length && !a.replaceExisting)
          throw new AppError(
            "CONTRADICTORY_METADATA",
            "Des valeurs existantes seraient remplacées. Présentez les différences et demandez explicitement le remplacement.",
            {
              conflicts: conflicts.map((field) => ({
                field,
                before: item.data[field],
                after: a.fields[field],
              })),
            },
          );
        return this.patch(item, a.expectedVersion, a.fields);
      }
      case "add_tags": {
        const item = await this.bibliographic(a.key);
        const tags = [...(item.data.tags || [])];
        for (const tag of a.tags)
          if (!tags.some((t) => t.tag === tag)) tags.push({ tag });
        return this.patch(item, a.expectedVersion, { tags });
      }
      case "add_to_collection": {
        const item = await this.bibliographic(a.key);
        await this.api.request(`/collections/${a.collectionKey}`);
        return this.patch(item, a.expectedVersion, {
          collections: [
            ...new Set([...(item.data.collections || []), a.collectionKey]),
          ],
        });
      }
      case "add_note": {
        await this.bibliographic(a.key);
        const escaped = a.text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        const note = escaped
          .split(/\n\s*\n/)
          .map((p: string) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
          .join("");
        const existing = await this.api.all(
          `/items/${a.key}/children?itemType=note`,
        );
        const same = existing.items.find((i) => i.data.note === note);
        if (same) return { unchanged: true, item: same };
        return this.create(
          {
            itemType: "note",
            parentItem: a.key,
            note,
            tags: [],
            collections: [],
            relations: {},
          },
          a.requestId,
          existing.version,
        );
      }
    }
  }
}
