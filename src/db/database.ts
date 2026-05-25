import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import { env } from "../env/process-env.js";
import type { Database } from "./database.types.js";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

export const closeDatabase = async (): Promise<void> => {
  await db.destroy();
};
