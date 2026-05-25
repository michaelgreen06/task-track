import { createHmac, randomBytes } from "node:crypto";

import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import type { User } from "../../db/database.types.js";
import { env } from "../../env/process-env.js";
import {
  createSession,
  deleteSessionByTokenHash,
  findUserBySessionTokenHash,
} from "./auth.repository.js";

const sessionCookieName = "task_track_session";
const sessionDurationDays = 30;
const magicLinkDurationMinutes = 15;

export const createRawToken = (): string => randomBytes(32).toString("hex");

export const hashToken = (token: string): string =>
  createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");

export const getMagicLinkExpiration = (): Date =>
  new Date(Date.now() + magicLinkDurationMinutes * 60 * 1000);

export const getSessionExpiration = (): Date =>
  new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000);

export const setSessionCookie = async (
  context: Context,
  userId: string,
): Promise<void> => {
  const rawSessionToken = createRawToken();
  const expiresAt = getSessionExpiration();

  await createSession(userId, hashToken(rawSessionToken), expiresAt);

  setCookie(context, sessionCookieName, rawSessionToken, {
    httpOnly: true,
    sameSite: "Lax",
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    expires: expiresAt,
  });
};

export const getCurrentUser = async (context: Context): Promise<User | null> => {
  const rawSessionToken = getCookie(context, sessionCookieName);

  if (rawSessionToken === undefined) {
    return null;
  }

  return await findUserBySessionTokenHash(hashToken(rawSessionToken), new Date());
};

export const clearCurrentSession = async (context: Context): Promise<void> => {
  const rawSessionToken = getCookie(context, sessionCookieName);

  if (rawSessionToken !== undefined) {
    await deleteSessionByTokenHash(hashToken(rawSessionToken));
  }

  deleteCookie(context, sessionCookieName, { path: "/" });
};
