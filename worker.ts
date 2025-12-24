import astroWorker from "./dist/_worker.js/index.js";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Pass through all requests for now
    return astroWorker.fetch(request, env, ctx);
  },
};
