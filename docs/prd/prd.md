# TaskTrack PRD

## Product Summary

TaskTrack is a simple private web app for capturing ideas as individual saved items. The first version is intentionally small: one user can sign in with a magic link, enter an idea, view saved ideas, edit them, delete them, and keep everything stored in Postgres.

The app should be built full stack with Hono serving HTML directly. Kysely should be used for typed database access. The first implementation should be simple enough to ship quickly while preserving a clean path toward separate private accounts and future local/cloud sync.

## Goals

- Let a user quickly capture an idea with minimal friction.
- Save each idea as its own database row.
- Associate every idea with a user account.
- Support editing and deleting saved ideas.
- Keep the backend and database structure simple, explicit, and strongly typed.
- Start with server-rendered HTML from Hono instead of a separate frontend framework.
- Design the data model so multi-user private accounts are easy later.

## Non-Goals

- No real-time sync in the MVP.
- No offline-first local database in the MVP.
- No teams, sharing, collaboration, or public pages.
- No complex task management features such as projects, due dates, priorities, reminders, or kanban boards.
- No separate React/Vite frontend for the first version.

## Target User

The initial target user is the app owner. In the future, each signed-in user should have a private account and a separate set of idea items.

## MVP User Stories

- As a user, I can sign in with a magic link so I do not need to manage a password.
- As a user, I can enter an idea in a simple form.
- As a user, I can save the idea and see it appear in my list.
- As a user, I can edit an existing idea.
- As a user, I can delete an existing idea.
- As a user, I can see only the ideas that belong to my account.
- As a user, I can see when an idea was created and last updated.

## MVP Functional Requirements

### Authentication

- The app must support magic-link sign-in.
- A user enters their email address.
- The app creates a short-lived login token and sends a magic-link email.
- When the user opens the link, the app validates the token and creates a session.
- The app should store sessions server-side or in signed secure cookies.
- The MVP may restrict access to a single allowlisted email address, while still using the same `users` table intended for future multi-user support.

### Ideas

- A signed-in user can create an idea.
- Each idea must contain `id`, `user_id`, `text`, `created_at`, and `updated_at`.
- Each idea may contain tags.
- Ideas should be listed newest first by default.
- A signed-in user can edit only their own ideas.
- A signed-in user can delete only their own ideas.
- Empty idea text should not be allowed.

### Tags

- Tags are included in the MVP data model, but the UI can stay simple.
- The first UI can accept tags as a comma-separated text input.
- Tags should be stored separately from ideas so filtering and cleanup are easier later.

### UI

- Hono should serve HTML pages directly.
- The first UI should include sign-in, magic-link confirmation, ideas list, create idea, edit idea, and delete flows.
- The interface should prioritize fast capture over complex layout.

## Recommended MVP Routes

```txt
GET  /login
POST /login
GET  /auth/magic-link/verify
POST /logout

GET  /
POST /ideas
GET  /ideas/:ideaId/edit
POST /ideas/:ideaId
POST /ideas/:ideaId/delete
```

For the first server-rendered version, `POST` routes are enough for mutations. Method override or API-style `PATCH`/`DELETE` can be added later if needed.

## Database Design

Use Postgres as the source of truth. Kysely should access the database through repository modules instead of direct database calls from route handlers.

### `users`

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `magic_link_tokens`

```sql
create table magic_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index magic_link_tokens_user_id_idx on magic_link_tokens(user_id);
create index magic_link_tokens_expires_at_idx on magic_link_tokens(expires_at);
```

Only store a hash of the token, not the raw token.

### `sessions`

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index sessions_user_id_idx on sessions(user_id);
create index sessions_expires_at_idx on sessions(expires_at);
```

### `ideas`

```sql
create table ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ideas_text_not_empty check (length(trim(text)) > 0)
);

create index ideas_user_id_created_at_idx on ideas(user_id, created_at desc);
```

### `tags`

```sql
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_not_empty check (length(trim(name)) > 0),
  constraint tags_user_id_name_unique unique (user_id, name)
);

create index tags_user_id_idx on tags(user_id);
```

### `idea_tags`

```sql
create table idea_tags (
  idea_id uuid not null references ideas(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, tag_id)
);

create index idea_tags_tag_id_idx on idea_tags(tag_id);
```

## Simplest Data Model Explanation

The simplest useful model is:

- `users`: who owns data.
- `ideas`: each saved item.
- `tags`: reusable labels owned by a user.
- `idea_tags`: many-to-many connection between ideas and tags.
- `magic_link_tokens`: temporary sign-in links.
- `sessions`: active signed-in browser sessions.

This keeps the core app small while avoiding a future migration from anonymous single-user data to real user-owned private data.

## Backend Structure Recommendation

```txt
src/
  index.ts
  db/
    database.ts
    database.types.ts
    migrations/
  env/
    process-env.ts
  features/
    auth/
      auth.repository.ts
      auth.routes.ts
      auth.schemas.ts
      session.ts
    ideas/
      idea.repository.ts
      idea.routes.ts
      idea.schemas.ts
  html/
    layout.ts
    pages.ts
```

Route handlers should validate input, call repositories, and return HTML. Repository modules should contain Kysely queries.

## Validation Requirements

- Validate login email before creating or finding a user.
- Validate magic-link token format before lookup.
- Validate idea text with a minimum length.
- Validate tags as normalized non-empty strings.
- Treat all form input as untrusted.
- Use Zod for request/form validation.

## Future Sync Direction

Future local/cloud sync should not be implemented in the MVP, but the database should avoid blocking it.

Likely future fields:

```sql
client_id text;
deleted_at timestamptz;
synced_at timestamptz;
version integer not null default 1;
```

These should wait until sync behavior is designed. Adding them too early would create unused complexity.

## Open Decisions

- Email provider for magic links.
- Session duration.
- Whether the MVP is restricted to one allowlisted email.
- Whether tags are shown as pills, plain text, or hidden until later.
- Whether deletes are hard deletes in MVP or soft deletes for future sync compatibility.

## Recommended MVP Build Order

1. Create Postgres connection and Kysely database types.
2. Add migrations for `users`, `magic_link_tokens`, `sessions`, `ideas`, `tags`, and `idea_tags`.
3. Build magic-link login and session handling.
4. Build authenticated ideas list page.
5. Build create/edit/delete idea flows.
6. Add simple tag parsing and display.
7. Add validation and ownership checks around every mutation.
8. Add typecheck and lint scripts to the implementation workflow.

## Success Criteria

- A user can sign in by magic link.
- A signed-in user can create an idea.
- Each created idea is saved as its own row in Postgres.
- A signed-in user can list, edit, and delete their own ideas.
- A user cannot access or mutate another user account's ideas.
- The app can run without a separate frontend framework.
- The schema supports future private multi-user accounts without a rewrite.
