import { Hono } from "hono";
import { cacheMiddleware } from "../middleware/cache";
import { getContentPage, getSiteConfig, listContentBlocks } from "../../services/contentService";

const fallbackSiteConfig = {
  brand: {
    name: "Kenya Corruption Archives",
    tagline: "Public Accountability Records",
    logoText: "K",
  },
  nav: [
    { to: "/", label: "Home" },
    { to: "/corruption-cases", label: "Corruption Cases" },
    { to: "/profiles", label: "Profiles" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/polls", label: "Polls" },
    { to: "/about", label: "About" },
  ],
  footer: {
    about: "Independent investigative journalism documenting public corruption in Kenya.",
    sections: [{ title: "Sections", links: [{ to: "/polls", label: "Polls" }] }],
    tipLine: "Secure submissions via encrypted channels. Anonymous tips welcomed.",
  },
};

const fallbackBlocks = [
  {
    key: "polls.methodology",
    title: "Methodology",
    body: "One vote per browser within the 7-day window. Duplicate votes are guarded server-side and totals are updated from accepted votes.",
  },
];

const fallbackPages: Record<string, {
  title: string;
  kicker: string;
  sections: Array<{ heading: string; body: string }>;
}> = {
  about: {
    title: "About Kenya Corruption Archives",
    kicker: "Our Mission",
    sections: [
      {
        heading: "How we report",
        body: "We start with documents, public records, court filings, audits, and direct verification before publishing investigations.",
      },
      {
        heading: "Send a tip",
        body: "We accept anonymous submissions and encourage readers to share verifiable records through secure channels.",
      },
      {
        heading: "Funding",
        body: "Kenya Corruption Archives is supported by reader contributions and independent editorial standards.",
      },
    ],
  },
};

export const contentRouter = new Hono();

contentRouter.get("/blocks", cacheMiddleware(), async (c) => {
  const keys = c.req.query("keys")?.split(",").map((key) => key.trim()).filter(Boolean);
  const blocks = await listContentBlocks(keys);
  const foundKeys = new Set(blocks.map((block) => block.key));
  const fallbackMatches = fallbackBlocks.filter((block) => {
    if (!keys || keys.length === 0) return true;
    return keys.includes(block.key) && !foundKeys.has(block.key);
  });
  return c.json([...blocks, ...fallbackMatches]);
});

contentRouter.get("/pages/:slug", cacheMiddleware(), async (c) => {
  const slug = c.req.param("slug");
  const page = await getContentPage(slug);
  if (!page && !fallbackPages[slug]) return c.json({ error: "Not found" }, 404);
  if (!page) return c.json(fallbackPages[slug]);
  return c.json(page);
});

contentRouter.get("/site", cacheMiddleware(), async (c) => {
  const site = await getSiteConfig();
  return c.json(site ?? fallbackSiteConfig);
});
