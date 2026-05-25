import type { User } from "../db/database.types.js";
import type { IdeaListItem } from "../features/ideas/idea.repository.js";
import { escapeHtml, formatDateTime, renderLayout } from "./layout.js";

type IdeaFormState = {
  text: string;
  tags: string;
  error: string | null;
};

export const renderLoginPage = (error: string | null): string =>
  renderLayout(
    "Sign in",
    `<section aria-labelledby="login-heading" class="panel stack">
      <div>
        <h1 id="login-heading">Sign in</h1>
        <p class="muted">Enter your email address.</p>
      </div>
      ${error === null ? "" : `<p class="error">${escapeHtml(error)}</p>`}
      <form class="stack" action="/login" method="post">
        <div class="field">
          <label for="email">Email address</label>
          <input id="email" name="email" type="email" autocomplete="email" required>
        </div>
        <button type="submit">Send magic link</button>
      </form>
    </section>`,
    null,
  );

export const renderMagicLinkSentPage = (email: string): string =>
  renderLayout(
    "Check email",
    `<section aria-labelledby="sent-heading" class="panel stack">
      <h1 id="sent-heading">Check email</h1>
      <p>A magic link for ${escapeHtml(email)} was printed to the server console.</p>
      <a href="/login">Use another email</a>
    </section>`,
    null,
  );

export const renderAuthErrorPage = (): string =>
  renderLayout(
    "Invalid link",
    `<section aria-labelledby="auth-error-heading" class="panel stack">
      <h1 id="auth-error-heading">Invalid link</h1>
      <p>The magic link is invalid, expired, or already used.</p>
      <a href="/login">Request a new link</a>
    </section>`,
    null,
  );

export const renderHomePage = (
  currentUser: User,
  ideas: ReadonlyArray<IdeaListItem>,
  formState: IdeaFormState,
): string =>
  renderLayout(
    "Ideas",
    `<section aria-labelledby="capture-heading" class="panel stack">
      <div>
        <h1 id="capture-heading">Capture idea</h1>
      </div>
      ${
        formState.error === null
          ? ""
          : `<p class="error">${escapeHtml(formState.error)}</p>`
      }
      <form class="stack" action="/ideas" method="post">
        <div class="field">
          <label for="text">Idea</label>
          <textarea id="text" name="text" required>${escapeHtml(formState.text)}</textarea>
        </div>
        <div class="field">
          <label for="tags">Tags</label>
          <input id="tags" name="tags" type="text" value="${escapeHtml(formState.tags)}">
        </div>
        <button type="submit">Save idea</button>
      </form>
    </section>

    <section aria-labelledby="ideas-heading" class="stack" style="margin-top: 28px;">
      <h2 id="ideas-heading">Saved ideas</h2>
      ${renderIdeaList(ideas)}
    </section>`,
    currentUser,
  );

export const renderEditIdeaPage = (
  currentUser: User,
  idea: IdeaListItem,
  error: string | null,
): string =>
  renderLayout(
    "Edit idea",
    `<section aria-labelledby="edit-heading" class="panel stack">
      <h1 id="edit-heading">Edit idea</h1>
      ${error === null ? "" : `<p class="error">${escapeHtml(error)}</p>`}
      <form class="stack" action="/ideas/${encodeURIComponent(idea.id)}" method="post">
        <div class="field">
          <label for="text">Idea</label>
          <textarea id="text" name="text" required>${escapeHtml(idea.text)}</textarea>
        </div>
        <div class="field">
          <label for="tags">Tags</label>
          <input id="tags" name="tags" type="text" value="${escapeHtml(idea.tags.join(", "))}">
        </div>
        <div class="actions">
          <button type="submit">Save changes</button>
          <a class="button button-secondary" href="/">Cancel</a>
        </div>
      </form>
    </section>`,
    currentUser,
  );

const renderIdeaList = (ideas: ReadonlyArray<IdeaListItem>): string => {
  if (ideas.length === 0) {
    return `<p class="muted">No ideas saved yet.</p>`;
  }

  return `<ul class="idea-list">
    ${ideas.map(renderIdeaListItem).join("")}
  </ul>`;
};

const renderIdeaListItem = (idea: IdeaListItem): string => `
  <li class="idea">
    <article>
      <p class="idea-text">${escapeHtml(idea.text)}</p>
      ${renderTags(idea.tags)}
      <p class="idea-meta">
        Created ${escapeHtml(formatDateTime(idea.created_at))}.
        Updated ${escapeHtml(formatDateTime(idea.updated_at))}.
      </p>
      <div class="actions" style="margin-top: 12px;">
        <a class="button button-secondary" href="/ideas/${encodeURIComponent(idea.id)}/edit">Edit</a>
        <form action="/ideas/${encodeURIComponent(idea.id)}/delete" method="post">
          <button class="button-danger" type="submit">Delete</button>
        </form>
      </div>
    </article>
  </li>`;

const renderTags = (tags: ReadonlyArray<string>): string => {
  if (tags.length === 0) {
    return "";
  }

  return `<ul class="tags">
    ${tags.map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join("")}
  </ul>`;
};
