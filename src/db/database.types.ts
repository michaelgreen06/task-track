import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

export type Timestamp = ColumnType<Date, Date | undefined, Date | undefined>;

export type UserTable = {
  id: Generated<string>;
  email: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type MagicLinkTokenTable = {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Timestamp;
  used_at: ColumnType<Date | null, Date | null | undefined, Date | null>;
  created_at: Timestamp;
};

export type SessionTable = {
  id: Generated<string>;
  user_id: string;
  session_token_hash: string;
  expires_at: Timestamp;
  created_at: Timestamp;
};

export type IdeaTable = {
  id: Generated<string>;
  user_id: string;
  text: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type TagTable = {
  id: Generated<string>;
  user_id: string;
  name: string;
  created_at: Timestamp;
};

export type IdeaTagTable = {
  idea_id: string;
  tag_id: string;
  created_at: Timestamp;
};

export type Database = {
  users: UserTable;
  magic_link_tokens: MagicLinkTokenTable;
  sessions: SessionTable;
  ideas: IdeaTable;
  tags: TagTable;
  idea_tags: IdeaTagTable;
};

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type MagicLinkToken = Selectable<MagicLinkTokenTable>;
export type NewMagicLinkToken = Insertable<MagicLinkTokenTable>;
export type Session = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type Idea = Selectable<IdeaTable>;
export type NewIdea = Insertable<IdeaTable>;
export type IdeaUpdate = Updateable<IdeaTable>;
export type Tag = Selectable<TagTable>;
export type NewTag = Insertable<TagTable>;
