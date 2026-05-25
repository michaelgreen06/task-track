import type { User } from "../db/database.types.js";

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const formatDateTime = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

export const renderLayout = (
  title: string,
  body: string,
  currentUser: User | null,
): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} - TaskTrack</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f7f4;
        --text: #20211f;
        --muted: #626760;
        --line: #d9dcd5;
        --panel: #ffffff;
        --accent: #0f6b57;
        --accent-dark: #084d3f;
        --danger: #a13825;
        --danger-bg: #fff0ec;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }

      a {
        color: var(--accent-dark);
      }

      header {
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }

      nav,
      main {
        width: min(900px, calc(100% - 32px));
        margin: 0 auto;
      }

      nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 0;
      }

      main {
        padding: 32px 0 56px;
      }

      h1,
      h2 {
        line-height: 1.15;
        margin: 0 0 16px;
      }

      p {
        margin: 0 0 16px;
      }

      form {
        margin: 0;
      }

      label {
        display: block;
        font-weight: 650;
        margin-bottom: 6px;
      }

      input,
      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 6px;
        color: var(--text);
        font: inherit;
        padding: 10px 12px;
      }

      textarea {
        min-height: 104px;
        resize: vertical;
      }

      button,
      .button {
        align-items: center;
        background: var(--accent);
        border: 1px solid var(--accent);
        border-radius: 6px;
        color: #ffffff;
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-weight: 700;
        justify-content: center;
        min-height: 40px;
        padding: 8px 14px;
        text-decoration: none;
      }

      button:hover,
      .button:hover {
        background: var(--accent-dark);
      }

      .button-secondary {
        background: transparent;
        border-color: var(--line);
        color: var(--text);
      }

      .button-secondary:hover {
        background: #eeeeea;
      }

      .button-danger {
        background: var(--danger-bg);
        border-color: #f0c9c0;
        color: var(--danger);
      }

      .button-danger:hover {
        background: #ffe0d8;
      }

      .brand {
        color: var(--text);
        font-size: 1.05rem;
        font-weight: 800;
        text-decoration: none;
      }

      .nav-user {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }

      .muted {
        color: var(--muted);
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 18px;
      }

      .stack {
        display: grid;
        gap: 16px;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .error {
        background: var(--danger-bg);
        border: 1px solid #f0c9c0;
        border-radius: 6px;
        color: var(--danger);
        padding: 10px 12px;
      }

      .idea-list {
        display: grid;
        gap: 12px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .idea {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
      }

      .idea-text {
        white-space: pre-wrap;
      }

      .idea-meta {
        color: var(--muted);
        font-size: 0.9rem;
        margin-top: 12px;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        list-style: none;
        margin: 12px 0 0;
        padding: 0;
      }

      .tag {
        background: #e8f1ee;
        border-radius: 999px;
        color: #124f43;
        font-size: 0.85rem;
        padding: 2px 8px;
      }
    </style>
  </head>
  <body>
    <header>
      <nav aria-label="Main navigation">
        <a class="brand" href="/">TaskTrack</a>
        ${
          currentUser === null
            ? ""
            : `<div class="nav-user">
                <span class="muted">${escapeHtml(currentUser.email)}</span>
                <form action="/logout" method="post">
                  <button class="button-secondary" type="submit">Sign out</button>
                </form>
              </div>`
        }
      </nav>
    </header>
    <main>
      ${body}
    </main>
  </body>
</html>`;
