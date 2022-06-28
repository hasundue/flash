import { flare } from "../mod.ts";

export default flare({
  "/": { 200: "Welcome to flash!" },

  format: {
    success: { message: true },
    error: { message: true },
  },
});
