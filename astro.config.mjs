import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://billbergquist.dev',
  vite: {
    plugins: [
      {
        name: 'room-code-rewrite',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url && /^\/retro\/[A-Z0-9]{4}$/i.test(req.url)) {
              req.url = '/retro/';
            }
            if (req.url && /^\/craps\/[A-Z0-9]{4}$/i.test(req.url)) {
              req.url = '/craps/';
            }
            next();
          });
        },
      },
    ],
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/retro') && !page.includes('/craps') && !page.includes('/blog/tag/'),
      customPages: [],
      serialize(item) {
        const path = item.url.replace('https://billbergquist.dev', '');

        // Use git-based lastmod dates (when content actually changed)
        const lastmodDates = {
          '/': '2026-03-08',
          '/services/': '2026-03-09',
          '/services/denver/': '2026-03-09',
          '/services/lakewood/': '2026-03-09',
          '/services/boulder/': '2026-03-09',
          '/services/arvada/': '2026-03-09',
          '/services/golden/': '2026-03-09',
          '/services/littleton/': '2026-03-09',
          '/about/': '2026-02-15',
          '/portfolio/': '2026-03-09',
          '/blog/': '2026-03-07',
          '/arcade/': '2026-03-01',
          '/arcade/descent/': '2026-02-04',
          '/arcade/gridlock/': '2026-03-01',
          '/privacy/': '2026-02-28',
          '/blog/ai-scam-bot-freelance-inquiry/': '2026-03-10',
          '/blog/how-much-does-a-website-cost-denver/': '2026-03-09',
          '/blog/template-vs-custom-website/': '2026-03-09',
          '/blog/signs-your-business-website-needs-redesign/': '2026-03-09',
          '/blog/rebuilding-critter-care-website/': '2026-03-09',
        };
        item.lastmod = lastmodDates[path] || '2026-02-28';

        const priorities = {
          '/': 0.8,
          '/services/': 1.0,
          '/services/denver/': 0.9,
          '/services/lakewood/': 0.9,
          '/services/boulder/': 0.9,
          '/services/arvada/': 0.9,
          '/services/golden/': 0.9,
          '/services/littleton/': 0.9,
          '/about/': 0.7,
          '/portfolio/': 0.7,
          '/blog/': 0.7,
          '/arcade/': 0.3,
          '/arcade/descent/': 0.3,
        };
        if (path.startsWith('/blog/tag/')) {
          item.priority = 0.4;
        } else if (path.startsWith('/blog/') && path !== '/blog/') {
          item.priority = 0.7;
        } else if (priorities[path] !== undefined) {
          item.priority = priorities[path];
        }
        return item;
      },
    }),
  ],
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
});
