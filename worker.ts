import astroWorker from "./dist/_worker.js/index.js";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Only cache GET requests
    if (request.method !== "GET") {
      return astroWorker.fetch(request, env, ctx);
    }

    // Create a versioned cache key by adding cache version to URL
    const cacheUrl = new URL(request.url);
    // Normalize URL by removing trailing slash
    if (cacheUrl.pathname.endsWith("/") && cacheUrl.pathname.length > 1) {
      cacheUrl.pathname = cacheUrl.pathname.slice(0, -1);
    }
    // Remove all query parameters for cache key
    cacheUrl.search = "";
    cacheUrl.searchParams.set("cache_v", env.CACHE_VERSION);
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = (caches as any).default as Cache;

    // Check if response exists in cache
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      // Cache hit - add debug header and return
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set("X-Cache-Status", "HIT");
      return response;
    }

    // Cache miss - fetch from Astro worker
    const fetchedResponse = await astroWorker.fetch(request, env, ctx);

    // Only cache successful responses (2xx status codes)
    if (fetchedResponse.status >= 200 && fetchedResponse.status < 300) {
      // Clone response and add cache headers
      const response = new Response(fetchedResponse.body, fetchedResponse);
      response.headers.set("Cache-Control", "s-maxage=31536000");
      response.headers.set("X-Cache-Status", "MISS");

      // Cache the response asynchronously
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } else {
      // Don't cache error responses, but add debug header
      const response = new Response(fetchedResponse.body, fetchedResponse);
      response.headers.set("X-Cache-Status", "MISS");
      return response;
    }
  },
};
