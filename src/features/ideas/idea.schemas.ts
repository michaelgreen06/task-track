import { z } from "zod";

export const ideaIdSchema = z.uuid();

export const ideaFormSchema = z.object({
  text: z.string().trim().min(1, "Idea text is required."),
  tags: z.string().trim(),
});

export type IdeaForm = z.infer<typeof ideaFormSchema>;

export const parseTagNames = (tags: string): ReadonlyArray<string> => {
  const tagNames = tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  return [...new Set(tagNames)];
};
