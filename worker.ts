import astroWorkerModule from "./dist/_worker.js/index.js";

type WorkerModule = {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
};

const astroWorker = astroWorkerModule as WorkerModule;
const VALID_LANGS = ["en", "zh", "ja", "it", "fr", "de", "es"];

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
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

    // Add language from cookie to cache key
    const cookieHeader = request.headers.get("Cookie") || "";
    const langMatch = cookieHeader.match(/(?:^|;\s*)lang=([^;]*)/);
    const lang = langMatch ? langMatch[1] : "en";
    // Validate lang is one of the supported languages
    const validLang = VALID_LANGS.includes(lang) ? lang : "en";
    cacheUrl.searchParams.set("lang", validLang);

    const cacheKeyString = cacheUrl.toString();
    const cacheKey = new Request(cacheKeyString, request);
    const cache = (caches as any).default as Cache;

    // Check if response exists in cache
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      // Cache hit - add debug headers and return
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set("X-Cache-Status", "HIT");
      response.headers.set("X-Cache-Key", cacheKeyString);
      return response;
    }

    // Cache miss - fetch from Astro worker
    const fetchedResponse = await astroWorker.fetch(request, env, ctx);
    const response = new Response(fetchedResponse.body, fetchedResponse);

    // Only cache successful responses (2xx status codes)
    if (fetchedResponse.status >= 200 && fetchedResponse.status < 300) {
      // Add cache headers (1 week TTL)
      response.headers.set("Cache-Control", "s-maxage=604800");
      response.headers.append("Cache-Tag", "astro-ssr");

      // Cache the response asynchronously
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    // Add debug headers
    response.headers.set("X-Cache-Status", "MISS");
    response.headers.set("X-Cache-Key", cacheKeyString);
    return response;
  },
} satisfies WorkerModule;
