import astroWorker from "./dist/_worker.js/index.js";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/projects/")) {
      const response = (await astroWorker.fetch(request, env, ctx)) as Response;

      response.headers.set(
        "Cache-Control",
        "public, max-age=3600, s-maxage=3600"
      );

      return response;
    }

    // Pass through all other requests to Astro worker
    return astroWorker.fetch(request, env, ctx);
  },
};
