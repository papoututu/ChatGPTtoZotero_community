import { z } from "zod";
export const key = z.string().regex(/^[A-Z0-9]{8}$/);
export const version = z.number().int().nonnegative();
export const text = z.string().trim().min(1).max(2000);
export const creator = z.union([
  z
    .object({
      creatorType: text,
      firstName: z.string().max(200).optional(),
      lastName: text,
    })
    .strict(),
  z.object({ creatorType: text, name: text }).strict(),
]);
export const fields = z.record(
  z.string(),
  z.union([z.string().max(20000), z.array(creator).max(100)]),
);
export const search = z
  .object({
    title: text.optional(),
    author: text.optional(),
    year: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
    DOI: text.optional(),
    ISBN: text.optional(),
    query: text.optional(),
  })
  .strict()
  .refine(
    (v) => Object.values(v).some(Boolean),
    "Un critère de recherche est nécessaire.",
  );
export const itemType = z.enum([
  "journalArticle",
  "book",
  "bookSection",
  "thesis",
  "report",
  "webpage",
]);
export const schemas = {
  search_items: search,
  get_item: z.object({ key, includeNotes: z.boolean().default(true) }).strict(),
  get_collections: z.object({ name: text.optional() }).strict(),
  create_item: z
    .object({
      itemType,
      fields,
      tags: z.array(text).max(100).default([]),
      collections: z.array(key).max(100).default([]),
      requestId: z.string().regex(/^[a-zA-Z0-9]{16,32}$/),
    })
    .strict(),
  update_item: z
    .object({
      key,
      expectedVersion: version,
      fields,
      replaceExisting: z.boolean().default(false),
    })
    .strict(),
  add_tags: z
    .object({
      key,
      expectedVersion: version,
      tags: z.array(text).min(1).max(100),
    })
    .strict(),
  add_to_collection: z
    .object({ key, expectedVersion: version, collectionKey: key })
    .strict(),
  add_note: z
    .object({
      key,
      text: z.string().trim().min(1).max(50000),
      requestId: z.string().regex(/^[a-zA-Z0-9]{16,32}$/),
    })
    .strict(),
};
export type Item = { key: string; version: number; data: Record<string, any> };
