import { default as nodeProcess } from "node:process";

import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { closeDatabase } from "./db/database.js";
import { env } from "./env/process-env.js";
import {
  consumeMagicLinkToken,
  createMagicLinkToken,
  findOrCreateUserByEmail,
} from "./features/auth/auth.repository.js";
import {
  loginFormSchema,
  magicLinkTokenSchema,
} from "./features/auth/auth.schemas.js";
import {
  clearCurrentSession,
  createRawToken,
  getCurrentUser,
  getMagicLinkExpiration,
  hashToken,
  setSessionCookie,
} from "./features/auth/session.js";
import {
  createIdeaForUser,
  deleteIdeaForUser,
  findIdeaForUser,
  listIdeasForUser,
  updateIdeaForUser,
} from "./features/ideas/idea.repository.js";
import {
  ideaFormSchema,
  ideaIdSchema,
  parseTagNames,
} from "./features/ideas/idea.schemas.js";
import {
  renderAuthErrorPage,
  renderEditIdeaPage,
  renderHomePage,
  renderLoginPage,
  renderMagicLinkSentPage,
} from "./html/pages.js";

const app = new Hono();

app.get("/login", async (context) => {
  const currentUser = await getCurrentUser(context);

  if (currentUser !== null) {
    return context.redirect("/");
  }

  return context.html(renderLoginPage(null));
});

app.post("/login", async (context) => {
  const formData = await context.req.formData();
  const parsedForm = loginFormSchema.safeParse({
    email: readFormString(formData, "email"),
  });

  if (!parsedForm.success) {
    return context.html(renderLoginPage("Enter a valid email address."), 400);
  }

  if (parsedForm.data.email !== env.ALLOWLISTED_EMAIL) {
    return context.html(renderLoginPage("This email is not allowed."), 403);
  }

  const user = await findOrCreateUserByEmail(parsedForm.data.email);
  const rawToken = createRawToken();
  const expiresAt = getMagicLinkExpiration();

  await createMagicLinkToken(user.id, hashToken(rawToken), expiresAt);

  const magicLink = new URL("/auth/magic-link/verify", env.APP_URL);
  magicLink.searchParams.set("token", rawToken);

  console.log(`TaskTrack magic link for ${user.email}: ${magicLink.toString()}`);

  return context.html(renderMagicLinkSentPage(user.email));
});

app.get("/auth/magic-link/verify", async (context) => {
  const parsedToken = magicLinkTokenSchema.safeParse(context.req.query("token"));

  if (!parsedToken.success) {
    return context.html(renderAuthErrorPage(), 400);
  }

  const user = await consumeMagicLinkToken(hashToken(parsedToken.data), new Date());

  if (user === null) {
    return context.html(renderAuthErrorPage(), 400);
  }

  await setSessionCookie(context, user.id);

  return context.redirect("/");
});

app.post("/logout", async (context) => {
  await clearCurrentSession(context);
  return context.redirect("/login");
});

app.get("/", async (context) => {
  const currentUser = await getCurrentUser(context);

  if (currentUser === null) {
    return context.redirect("/login");
  }

  const ideas = await listIdeasForUser(currentUser.id);

  return context.html(
    renderHomePage(currentUser, ideas, { text: "", tags: "", error: null }),
  );
});

app.post("/ideas", async (context) => {
  const currentUser = await getCurrentUser(context);

  if (currentUser === null) {
    return context.redirect("/login");
  }

  const formData = await context.req.formData();
  const parsedForm = ideaFormSchema.safeParse({
    text: readFormString(formData, "text"),
    tags: readFormString(formData, "tags"),
  });

  if (!parsedForm.success) {
    const ideas = await listIdeasForUser(currentUser.id);

    return context.html(
      renderHomePage(currentUser, ideas, {
        text: readFormString(formData, "text"),
        tags: readFormString(formData, "tags"),
        error: "Idea text is required.",
      }),
      400,
    );
  }

  await createIdeaForUser(
    currentUser.id,
    parsedForm.data.text,
    parseTagNames(parsedForm.data.tags),
  );

  return context.redirect("/");
});

app.get("/ideas/:ideaId/edit", async (context) => {
  const currentUser = await getCurrentUser(context);

  if (currentUser === null) {
    return context.redirect("/login");
  }

  const parsedIdeaId = ideaIdSchema.safeParse(context.req.param("ideaId"));

  if (!parsedIdeaId.success) {
    return context.notFound();
  }

  const idea = await findIdeaForUser(parsedIdeaId.data, currentUser.id);

  if (idea === null) {
    return context.notFound();
  }

  return context.html(renderEditIdeaPage(currentUser, idea, null));
});

app.post("/ideas/:ideaId", async (context) => {
  const currentUser = await getCurrentUser(context);

  if (currentUser === null) {
    return context.redirect("/login");
  }

  const parsedIdeaId = ideaIdSchema.safeParse(context.req.param("ideaId"));

  if (!parsedIdeaId.success) {
    return context.notFound();
  }

  const idea = await findIdeaForUser(parsedIdeaId.data, currentUser.id);

  if (idea === null) {
    return context.notFound();
  }

  const formData = await context.req.formData();
  const parsedForm = ideaFormSchema.safeParse({
    text: readFormString(formData, "text"),
    tags: readFormString(formData, "tags"),
  });

  if (!parsedForm.success) {
    return context.html(
      renderEditIdeaPage(
        currentUser,
        {
          ...idea,
          text: readFormString(formData, "text"),
          tags: parseTagNames(readFormString(formData, "tags")),
        },
        "Idea text is required.",
      ),
      400,
    );
  }

  const updated = await updateIdeaForUser(
    parsedIdeaId.data,
    currentUser.id,
    parsedForm.data.text,
    parseTagNames(parsedForm.data.tags),
  );

  if (!updated) {
    return context.notFound();
  }

  return context.redirect("/");
});

app.post("/ideas/:ideaId/delete", async (context) => {
  const currentUser = await getCurrentUser(context);

  if (currentUser === null) {
    return context.redirect("/login");
  }

  const parsedIdeaId = ideaIdSchema.safeParse(context.req.param("ideaId"));

  if (!parsedIdeaId.success) {
    return context.notFound();
  }

  await deleteIdeaForUser(parsedIdeaId.data, currentUser.id);

  return context.redirect("/");
});

const readFormString = (formData: FormData, name: string): string => {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value;
};

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`TaskTrack listening on ${env.APP_URL}`);

const shutdown = async (): Promise<void> => {
  server.close();
  await closeDatabase();
};

nodeProcess.on("SIGINT", () => {
  void shutdown();
});

nodeProcess.on("SIGTERM", () => {
  void shutdown();
});
