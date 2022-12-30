import { Resource } from "../../types/resource.ts";

export const repos: Resource<{
  keys: { owner: string; repo: string };
  body: { tags: string[] };
  meta: { updated_at: Date };
  query: { since?: Date; until?: Date };
}> = ({ storage, operators }) => ({
  list: async ({ since, until }) => {
    const { gt, lt, and } = operators;
    return await storage.list({
      updated_at: (it) => and(gt(it, since), lt(it, until)),
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
  set: async ({ owner, repo }, { tags }) => {
    const updated_at = new Date();
    await storage.set({ owner, repo }, { tags }, { updated_at });
    return { updated_at };
  },
});
