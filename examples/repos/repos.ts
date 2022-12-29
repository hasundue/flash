import { Resource } from "../../types/resource.ts";

export const repos: Resource<{
  spec: { owner: string; repo: string };
  data: { issues: string[] };
  meta: { updated_at: Date };
  query: { since?: Date; until?: Date };
}> = ({ storage }) => ({
  create: async ({ owner, repo }) => {
    const issues: string[] = [];
    const updated_at = new Date();
    await storage.put({ owner, repo, issues, updated_at });
    return { owner, repo, issues, updated_at };
  },
  get: async ({ owner, repo }) => {
    return await storage.get({ owner, repo });
  },
  put: async ({ owner, repo, issues }) => {
    const updated_at = new Date();
    await storage.put({ owner, repo, issues, updated_at });
    return { updated_at };
  },
  list: async ({ since, until }) => {
    return await storage.list({
      updated_at: (it) => it > (since ?? 0) && it < (until ?? Infinity),
    });
  },
});
