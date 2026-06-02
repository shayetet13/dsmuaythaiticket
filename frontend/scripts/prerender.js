/**
 * Prerender script for SEO - generates static HTML for crawlers
 * Run after build: npm run build && node scripts/prerender.js
 * Uses Puppeteer to render routes and save HTML for better search engine indexing
 *
 * Skip on VPS/CI (Puppeteer needs Chrome dependencies): SKIP_PRERENDER=1 npm run build
 */
if (process.env.SKIP_PRERENDER === '1' || process.env.SKIP_PRERENDER === 'true') {
  console.log('[prerender] Skipped (SKIP_PRERENDER is set). Build will use default SPA output.');
  process.exit(0);
}

import { createServer } from 'http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const ROUTES = ['/', '/booking', '/success'];
const RENDER_WAIT_MS = 3000;
const PORT = 4174;
const PRODUCTION_URL = 'https://dsmuaythaiticket.com';

function serveStatic(req, res) {
  const path = req.url.split('?')[0];
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(path) && !path.endsWith('/');
  const filePath = join(DIST_DIR, hasExtension ? path.slice(1) : 'index.html');
  try {
    const content = readFileSync(filePath);
    const ext = (filePath.split('.').pop() || '').toLowerCase();
    const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', webp: 'image/webp', ico: 'image/x-icon' };
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}

async function runPrerender() {
  if (!existsSync(DIST_DIR)) {
    console.error('[prerender] dist folder not found. Run "npm run build" first.');
    process.exit(1);
  }

  const server = createServer(serveStatic);
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[prerender] Serving dist at http://127.0.0.1:${PORT}`);
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  const browser = await puppeteer.launch({ headless: true });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      // Block API requests during prerender (API may not be available at build time)
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('/api/')) {
          req.abort();
        } else {
          req.continue();
        }
      });
      await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise((r) => setTimeout(r, RENDER_WAIT_MS));
      const html = await page.content();
      await page.close();

      const outPath = route === '/' ? join(DIST_DIR, 'index.html') : join(DIST_DIR, route.slice(1), 'index.html');
      mkdirSync(dirname(outPath), { recursive: true });
      // Replace localhost URLs with production URL in output
      const finalHtml = html.replace(new RegExp(`http://127\\.0\\.0\\.1:${PORT}`, 'g'), PRODUCTION_URL);
      writeFileSync(outPath, finalHtml);
      console.log(`[prerender] Rendered ${route} -> ${outPath}`);
    }
    console.log('[prerender] Done!');
  } finally {
    await browser.close();
    server.close();
  }
}

runPrerender().catch((err) => {
  console.error('[prerender] Error:', err);
  process.exit(1);
});
