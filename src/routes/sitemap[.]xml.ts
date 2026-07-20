import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { devs } from "@/lib/hooddb-data";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/leaderboard", changefreq: "hourly", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          ...devs.map((d) => ({
            path: `/dev/${d.address}`,
            changefreq: "daily" as const,
            priority: "0.7",
          })),
        ];

        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
