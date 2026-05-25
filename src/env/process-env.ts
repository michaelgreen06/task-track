import { env as processEnv } from "node:process";

import { z } from "zod";

const processEnvSchema = z.object({
  DATABASE_URL: z
    .url()
    .default("postgres://tasktrack:tasktrack@localhost:5432/tasktrack"),
  APP_URL: z.url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32).default("dev-auth-secret-change-me-please-32"),
  ALLOWLISTED_EMAIL: z.email().default("michaelgreen06@gmail.com"),
  PORT: z.coerce.number().int().positive().default(3000),
});

const parsedEnv = processEnvSchema.parse({
  DATABASE_URL: processEnv["DATABASE_URL"],
  APP_URL: processEnv["APP_URL"],
  AUTH_SECRET: processEnv["AUTH_SECRET"],
  ALLOWLISTED_EMAIL: processEnv["ALLOWLISTED_EMAIL"],
  PORT: processEnv["PORT"],
});

export { parsedEnv as env };
