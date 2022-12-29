import { Application } from "../../mod.ts";
import { Redis } from "../../platforms/upstash.ts";
import { repos } from "./repos.ts";

const redis = new Redis({});

export const app: Application = {
  resources: [
    {
      name: "repository",
      alias: { singular: "repo", plural: "repos" },
      main: repos,
      storage: redis,
    },
  ],
};
