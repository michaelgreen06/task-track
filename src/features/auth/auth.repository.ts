import type { User } from "../../db/database.types.js";
import { db } from "../../db/database.js";

export const findOrCreateUserByEmail = async (email: string): Promise<User> => {
  const existingUser = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();

  if (existingUser !== undefined) {
    return existingUser;
  }

  return await db
    .insertInto("users")
    .values({ email })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const createMagicLinkToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> => {
  await db
    .insertInto("magic_link_tokens")
    .values({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .execute();
};

export const consumeMagicLinkToken = async (
  tokenHash: string,
  now: Date,
): Promise<User | null> => {
  return await db.transaction().execute(async (transaction) => {
    const token = await transaction
      .selectFrom("magic_link_tokens")
      .select(["id", "user_id"])
      .where("token_hash", "=", tokenHash)
      .where("used_at", "is", null)
      .where("expires_at", ">", now)
      .executeTakeFirst();

    if (token === undefined) {
      return null;
    }

    await transaction
      .updateTable("magic_link_tokens")
      .set({ used_at: now })
      .where("id", "=", token.id)
      .execute();

    const user = await transaction
      .selectFrom("users")
      .selectAll()
      .where("id", "=", token.user_id)
      .executeTakeFirst();

    return user ?? null;
  });
};

export const createSession = async (
  userId: string,
  sessionTokenHash: string,
  expiresAt: Date,
): Promise<void> => {
  await db
    .insertInto("sessions")
    .values({
      user_id: userId,
      session_token_hash: sessionTokenHash,
      expires_at: expiresAt,
    })
    .execute();
};

export const findUserBySessionTokenHash = async (
  sessionTokenHash: string,
  now: Date,
): Promise<User | null> => {
  const user = await db
    .selectFrom("sessions")
    .innerJoin("users", "users.id", "sessions.user_id")
    .select([
      "users.id",
      "users.email",
      "users.created_at",
      "users.updated_at",
    ])
    .where("sessions.session_token_hash", "=", sessionTokenHash)
    .where("sessions.expires_at", ">", now)
    .executeTakeFirst();

  return user ?? null;
};

export const deleteSessionByTokenHash = async (
  sessionTokenHash: string,
): Promise<void> => {
  await db
    .deleteFrom("sessions")
    .where("session_token_hash", "=", sessionTokenHash)
    .execute();
};
