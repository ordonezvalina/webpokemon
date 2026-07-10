import type { APIRoute } from "astro";

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://example.com";
const base = SITE_URL.replace(/\/$/, "");

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /panel-secreto/

Sitemap: ${base}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
