import { Resource } from "../../core/resource.ts";

export type Repository = {
  spec: { owner: string; repo: string };
  body: { tags: string[] };
  meta: { created_at: Date; updated_at: Date };
  query: { since?: Date; until?: Date };
};

const repository: Resource<Repository> = ({ storage, operators }) => ({
  list: async ({ since, until }) => {
    const { gt, lt, and } = operators;
    return await storage.list({
      updated_at: and(gt(since), lt(until)),
    });
  },
  get: async ({ owner, repo }) => {
    return await storage.get({ owner, repo });
  },
  put: async ({ owner, repo }, { tags }) => {
    const created_at = new Date();
    const updated_at = created_at;
    await storage.put({ owner, repo }, { tags, created_at, updated_at });
  },
  set: async ({ owner, repo }, { tags }) => {
    const updated_at = new Date();
    await storage.set({ owner, repo }, { tags, updated_at });
  },
});

export default repository;
