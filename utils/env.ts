import { load } from "https://deno.land/std@0.204.0/dotenv/mod.ts";

export const env = Deno.env.get("CI") ? Deno.env.toObject() : await load();
