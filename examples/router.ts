import { flash } from "../mod.ts";

export default flash({
  "/": ({ request }) => `Welcome to ${new URL(request.url).hostname}!`,

  "/create": {
    POST: () => {
      /* do something here */
      return "201: Created REST API in a flash!";
    },
  },

  "/object/:name": {
    GET: ({ params }) => ({ name: params.name }),
  },

  404: "404: Not found",
});
