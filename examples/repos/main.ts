import { repos } from "./repos.ts";
import {} from "../../adapters/cloudflare.ts";

export const app = flash.rest({
  "/repos": repos,
});
