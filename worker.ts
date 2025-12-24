import astroWorker from "./dist/_worker.js/index.js";

const BUILD_ID = "__BUILD_ID_PLACEHOLDER__";

// Extend CacheStorage with Cloudflare's default property
declare global {
  interface CacheStorage {
    readonly default: Cache;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/projects/")) {
      const etag = `"${BUILD_ID}"`;

      // Create cache key without cookies
      const cacheKey = new Request(url.toString(), {
        method: request.method,
        headers: new Headers({
          Accept: request.headers.get("Accept") || "*/*",
          "Accept-Encoding": request.headers.get("Accept-Encoding") || "gzip",
        }),
      });

      // Check edge cache
      const cache = caches.default;
      let cachedResponse = await cache.match(cacheKey);

      if (!cachedResponse) {
        // Not cached - fetch from Astro
        let response = (await astroWorker.fetch(request, env, ctx)) as Response;

        if (response.ok) {
          const bodyText = await response.text();

          // Create new response with proper headers
          response = new Response(bodyText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });

          response.headers.set("ETag", etag);
          response.headers.set(
            "Cache-Control",
            "public, max-age=0, must-revalidate"
          );

          // Cache at edge
          ctx.waitUntil(cache.put(cacheKey, response.clone()));
        }

        return response;
      }

      // Return cached response with proper headers
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set("ETag", etag);
      response.headers.set(
        "Cache-Control",
        "public, max-age=0, must-revalidate"
      );
      return response;
    }

    // Pass through all other requests
    return astroWorker.fetch(request, env, ctx);
  },
};
