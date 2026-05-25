import { sql, type Kysely } from "kysely";

export const up = async (db: Kysely<unknown>): Promise<void> => {
  await sql`create extension if not exists pgcrypto`.execute(db);

  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (column) =>
      column.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("email", "text", (column) => column.notNull().unique())
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable("magic_link_tokens")
    .addColumn("id", "uuid", (column) =>
      column.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("user_id", "uuid", (column) =>
      column.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("token_hash", "text", (column) => column.notNull().unique())
    .addColumn("expires_at", "timestamptz", (column) => column.notNull())
    .addColumn("used_at", "timestamptz")
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("magic_link_tokens_user_id_idx")
    .on("magic_link_tokens")
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("magic_link_tokens_expires_at_idx")
    .on("magic_link_tokens")
    .column("expires_at")
    .execute();

  await db.schema
    .createTable("sessions")
    .addColumn("id", "uuid", (column) =>
      column.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("user_id", "uuid", (column) =>
      column.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("session_token_hash", "text", (column) => column.notNull().unique())
    .addColumn("expires_at", "timestamptz", (column) => column.notNull())
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("sessions_user_id_idx")
    .on("sessions")
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("sessions_expires_at_idx")
    .on("sessions")
    .column("expires_at")
    .execute();

  await db.schema
    .createTable("ideas")
    .addColumn("id", "uuid", (column) =>
      column.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("user_id", "uuid", (column) =>
      column.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("text", "text", (column) => column.notNull())
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addCheckConstraint("ideas_text_not_empty", sql`length(trim(text)) > 0`)
    .execute();

  await sql`
    create index ideas_user_id_created_at_idx
    on ideas(user_id, created_at desc)
  `.execute(db);

  await db.schema
    .createTable("tags")
    .addColumn("id", "uuid", (column) =>
      column.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("user_id", "uuid", (column) =>
      column.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (column) => column.notNull())
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addCheckConstraint("tags_name_not_empty", sql`length(trim(name)) > 0`)
    .addUniqueConstraint("tags_user_id_name_unique", ["user_id", "name"])
    .execute();

  await db.schema
    .createIndex("tags_user_id_idx")
    .on("tags")
    .column("user_id")
    .execute();

  await db.schema
    .createTable("idea_tags")
    .addColumn("idea_id", "uuid", (column) =>
      column.notNull().references("ideas.id").onDelete("cascade"),
    )
    .addColumn("tag_id", "uuid", (column) =>
      column.notNull().references("tags.id").onDelete("cascade"),
    )
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint("idea_tags_pkey", ["idea_id", "tag_id"])
    .execute();

  await db.schema
    .createIndex("idea_tags_tag_id_idx")
    .on("idea_tags")
    .column("tag_id")
    .execute();
};

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable("idea_tags").ifExists().execute();
  await db.schema.dropTable("tags").ifExists().execute();
  await db.schema.dropTable("ideas").ifExists().execute();
  await db.schema.dropTable("sessions").ifExists().execute();
  await db.schema.dropTable("magic_link_tokens").ifExists().execute();
  await db.schema.dropTable("users").ifExists().execute();
};
