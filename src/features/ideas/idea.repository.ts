import type { Kysely, Transaction } from "kysely";

import type { Database, Idea, Tag } from "../../db/database.types.js";
import { db } from "../../db/database.js";

export type IdeaListItem = Idea & {
  tags: ReadonlyArray<string>;
};

export const listIdeasForUser = async (
  userId: string,
): Promise<ReadonlyArray<IdeaListItem>> => {
  const ideas = await db
    .selectFrom("ideas")
    .selectAll()
    .where("user_id", "=", userId)
    .orderBy("created_at", "desc")
    .execute();

  if (ideas.length === 0) {
    return [];
  }

  const ideaIds = ideas.map((idea) => idea.id);
  const tagRows = await db
    .selectFrom("idea_tags")
    .innerJoin("tags", "tags.id", "idea_tags.tag_id")
    .select(["idea_tags.idea_id", "tags.name"])
    .where("idea_tags.idea_id", "in", ideaIds)
    .orderBy("tags.name", "asc")
    .execute();

  const tagsByIdeaId = new Map<string, Array<string>>();

  for (const tagRow of tagRows) {
    const existingTags = tagsByIdeaId.get(tagRow.idea_id) ?? [];
    existingTags.push(tagRow.name);
    tagsByIdeaId.set(tagRow.idea_id, existingTags);
  }

  return ideas.map((idea) => ({
    ...idea,
    tags: tagsByIdeaId.get(idea.id) ?? [],
  }));
};

export const findIdeaForUser = async (
  ideaId: string,
  userId: string,
): Promise<IdeaListItem | null> => {
  const idea = await db
    .selectFrom("ideas")
    .selectAll()
    .where("id", "=", ideaId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (idea === undefined) {
    return null;
  }

  const tags = await listTagsForIdea(idea.id);

  return {
    ...idea,
    tags: tags.map((tag) => tag.name),
  };
};

export const createIdeaForUser = async (
  userId: string,
  text: string,
  tagNames: ReadonlyArray<string>,
): Promise<void> => {
  await db.transaction().execute(async (transaction) => {
    const idea = await transaction
      .insertInto("ideas")
      .values({ user_id: userId, text })
      .returningAll()
      .executeTakeFirstOrThrow();

    await replaceIdeaTagsForUser(transaction, idea.id, userId, tagNames);
  });
};

export const updateIdeaForUser = async (
  ideaId: string,
  userId: string,
  text: string,
  tagNames: ReadonlyArray<string>,
): Promise<boolean> => {
  return await db.transaction().execute(async (transaction) => {
    const updatedIdea = await transaction
      .updateTable("ideas")
      .set({ text, updated_at: new Date() })
      .where("id", "=", ideaId)
      .where("user_id", "=", userId)
      .returning("id")
      .executeTakeFirst();

    if (updatedIdea === undefined) {
      return false;
    }

    await replaceIdeaTagsForUser(transaction, ideaId, userId, tagNames);
    return true;
  });
};

export const deleteIdeaForUser = async (
  ideaId: string,
  userId: string,
): Promise<void> => {
  await db
    .deleteFrom("ideas")
    .where("id", "=", ideaId)
    .where("user_id", "=", userId)
    .execute();
};

const listTagsForIdea = async (ideaId: string): Promise<ReadonlyArray<Tag>> => {
  return await db
    .selectFrom("idea_tags")
    .innerJoin("tags", "tags.id", "idea_tags.tag_id")
    .select(["tags.id", "tags.user_id", "tags.name", "tags.created_at"])
    .where("idea_tags.idea_id", "=", ideaId)
    .orderBy("tags.name", "asc")
    .execute();
};

const replaceIdeaTagsForUser = async (
  executor: Kysely<Database> | Transaction<Database>,
  ideaId: string,
  userId: string,
  tagNames: ReadonlyArray<string>,
): Promise<void> => {
  await executor.deleteFrom("idea_tags").where("idea_id", "=", ideaId).execute();

  if (tagNames.length === 0) {
    return;
  }

  await executor
    .insertInto("tags")
    .values(tagNames.map((name) => ({ user_id: userId, name })))
    .onConflict((conflict) => conflict.columns(["user_id", "name"]).doNothing())
    .execute();

  const tags = await executor
    .selectFrom("tags")
    .select(["id", "name"])
    .where("user_id", "=", userId)
    .where("name", "in", tagNames)
    .execute();

  if (tags.length === 0) {
    return;
  }

  await executor
    .insertInto("idea_tags")
    .values(tags.map((tag) => ({ idea_id: ideaId, tag_id: tag.id })))
    .execute();
};
