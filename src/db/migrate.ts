import * as fs from "node:fs/promises";
import * as path from "node:path";

import { FileMigrationProvider, Migrator } from "kysely/migration";

import { db, closeDatabase } from "./database.js";

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(import.meta.dirname, "migrations"),
  }),
});

const { error, results } = await migrator.migrateToLatest();

for (const result of results ?? []) {
  if (result.status === "Success") {
    console.log(`migration ${result.migrationName} succeeded`);
  }

  if (result.status === "Error") {
    console.error(`migration ${result.migrationName} failed`);
  }
}

await closeDatabase();

if (error instanceof Error) {
  console.error(error.message);
  throw error;
}
