import { flash, Resource } from "../cloudflare.ts";

type Repository = {
  owner: string;
  repo: string;
};

const repos: Resource<Repository> = ({ storage }) => ({
  GET: async () => {
    return await storage.list();
  },
  "/:owner/:repo": (params: { owner: string; repo: string }) => ({
    GET: async () => {
      return await storage.get(`${params.owner}/${params.repo}`);
    },
    "issues": issues,
  }),
});

type Issue = {
  id: number;
  creator: string;
  date: Date;
};

const issues: Resource<Issue> = ({ storage }) => ({
  /**
   * List issues
   */
  GET: async (params: {
    creator?: string;
    since?: Date;
    until?: Date;
  }) => {
    return (await storage.list()).filter((it) =>
      it.creator === (params.creator ?? it.creator) &&
      it.date >= (params.since ?? 0) &&
      it.date <= (params.until ?? Infinity)
    );
  },

  /**
   * Create an issue
   */
  POST: async (body: {
    creator: string;
  }) => {
    const id = await storage.count();
    await storage.put(id, {
      id,
      creator: body.creator,
      date: new Date(),
    });
  },

  /**
   * Get an issue specified by ID
   */
  "/:id": async (params: { id: string }) => {
    return await storage.get(params.id);
  },
});

export const app = flash.rest({
  "/repos": repos,
});
