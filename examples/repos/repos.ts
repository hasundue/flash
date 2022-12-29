import { Resource } from "../../types/resource.ts";

export const repos: Resource<{
  keys: { owner: string; repo: string };
  body: { tags: string[] };
  meta: { updated_at: Date };
  query: { since?: Date; until?: Date };
}> = ({ storage }) => ({
  list: async ({ since, until }) => {
    return await storage.list({
      updated_at: (it) => it > (since ?? 0) && it < (until ?? Infinity),
    });
  },
  get: async ({ owner, repo }) => {
    return await storage.get({ owner, repo });
  },
  put: async ({ owner, repo }, { tags }) => {
    const updated_at = new Date();
    await storage.put({ owner, repo }, { tags }, { updated_at });
    return { owner, repo, tags, updated_at };
  },
  update: async ({ owner, repo }, { tags }) => {
    const updated_at = new Date();
    await storage.update({ owner, repo }, { tags }, { updated_at });
    return { updated_at };
  },
});
