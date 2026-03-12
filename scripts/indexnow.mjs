/**
 * Post-build script: submit all sitemap URLs to IndexNow (Bing, Yandex, DuckDuckGo).
 * Runs automatically after `astro build` via the npm build script.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HOST = 'billbergquist.dev';
const KEY = '28eed14ef142d8b027de9c8df205d45f';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

// Parse URLs from the built sitemap
const sitemapPath = resolve('dist', 'sitemap-0.xml');
let xml;
try {
  xml = readFileSync(sitemapPath, 'utf-8');
} catch {
  console.log('[IndexNow] No sitemap found at dist/sitemap-0.xml, skipping.');
  process.exit(0);
}

const urls = [...xml.matchAll(/<loc>(.+?)<\/loc>/g)].map((m) => m[1]);

if (urls.length === 0) {
  console.log('[IndexNow] No URLs found in sitemap, skipping.');
  process.exit(0);
}

console.log(`[IndexNow] Submitting ${urls.length} URLs...`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls,
};

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  console.log(`[IndexNow] Response: ${res.status} ${res.statusText}`);
  if (res.status >= 400) {
    const body = await res.text();
    console.log(`[IndexNow] Body: ${body}`);
  }
} catch (err) {
  console.error(`[IndexNow] Request failed:`, err.message);
}
