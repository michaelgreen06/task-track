import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email().trim().transform((email) => email.toLowerCase()),
});

export const magicLinkTokenSchema = z.string().min(32).max(256);

export type LoginForm = z.infer<typeof loginFormSchema>;
