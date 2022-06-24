import { flash } from "../mod.ts";

export default flash({
  "/": { message: "Flash Demo" },

  "/create": {
    POST: () => {
      // Do something here
      return { message: "Created", name: "flash", status: 201 };
    },
  },

  "/object/:name": {
    GET: ({ params }) => ({ name: params.name }),
  },

  404: { message: "Not Found", status: 404 },
});
