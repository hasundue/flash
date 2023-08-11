import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { build } from "../mod.ts";

const app = await build("./app.ts");

serve(app.fetch);
