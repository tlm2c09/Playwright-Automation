import { z } from 'zod';

/**
 * Nested Schema: User
 * GitHub returns a 'user' object inside the issue. We define it separately for reuse.
 */
const UserSchema = z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.url(),
    url: z.url(),
});

/**
 * Main Schema: Issue Response
 * This validates the full JSON response from GET /issues/{id}
 */
export const IssueSchema = z.object({
  url: z.url(),
  id: z.number(),
  node_id: z.string(),
  number: z.number(),
  title: z.string(),
  user: UserSchema, // Nesting the schema here
  state: z.enum(['open', 'closed']), // Strict check: value must be 'open' or 'closed' only
  locked: z.boolean(),
  comments: z.number().nonnegative(), // Cannot have -1 comments
  created_at: z.iso.datetime(), // Validates ISO 8601 Date
  updated_at: z.iso.datetime(),
  body: z.string().nullable(), // GitHub allows body to be null
});

// Extract the Type for use in tests if needed
export type IssueResponse = z.infer<typeof IssueSchema>;