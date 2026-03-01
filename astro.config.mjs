import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://billbergquist.dev',
  vite: {
    plugins: [
      {
        name: 'retro-room-rewrite',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url && /^\/retro\/[A-Z0-9]{4}$/i.test(req.url)) {
              req.url = '/retro/';
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
      filter: (page) => !page.includes('/404') && !page.includes('/retro'),
      customPages: [],
      serialize(item) {
        const priorities = {
          '/': 0.8,
          '/services/': 1.0,
          '/services/denver/': 0.9,
          '/services/lakewood/': 0.9,
          '/services/boulder/': 0.9,
          '/about/': 0.7,
          '/projects/': 0.7,
          '/blog/': 0.7,
          '/arcade/': 0.3,
          '/arcade/descent/': 0.3,
        };
        const path = item.url.replace('https://billbergquist.dev', '');
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
});
