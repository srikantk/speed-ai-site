const { test, expect } = require('@playwright/test');

const PAGES = ['/', '/speed-pdf.html', '/about.html', '/pricing.html', '/blog.html'];

function toLocalPath(urlString, currentPageUrl, baseOrigin) {
  if (!urlString) return null;

  const trimmed = urlString.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^(mailto:|tel:|javascript:)/i.test(trimmed)) return null;

  const resolved = new URL(trimmed, currentPageUrl);
  if (resolved.origin !== baseOrigin) return null;

  return `${resolved.pathname}${resolved.search}`;
}

test('all core pages respond and render an H1', async ({ page, request }) => {
  for (const path of PAGES) {
    const response = await request.get(path);
    expect(response.status(), `Expected 2xx for ${path}`).toBeGreaterThanOrEqual(200);
    expect(response.status(), `Expected 2xx for ${path}`).toBeLessThan(300);

    await page.goto(path);
    await expect(page.locator('h1').first(), `Expected a visible H1 on ${path}`).toBeVisible();
  }
});

test('pages load without console/page/runtime request errors', async ({ page }) => {
  for (const path of PAGES) {
    const issues = [];

    const onConsole = (msg) => {
      if (msg.type() === 'error') {
        issues.push(`console error: ${msg.text()}`);
      }
    };
    const onPageError = (err) => issues.push(`page error: ${err.message}`);
    const onRequestFailed = (req) => {
      const errorText = req.failure()?.errorText || '';
      const isAbortedFont = req.resourceType() === 'font' && /ERR_ABORTED/i.test(errorText);
      if (isAbortedFont) return;
      issues.push(`request failed: ${req.method()} ${req.url()} ${errorText}`.trim());
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('requestfailed', onRequestFailed);

    await page.goto(path, { waitUntil: 'load' });

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('requestfailed', onRequestFailed);

    expect(issues, `Runtime issues on ${path}`).toEqual([]);
  }
});

test('all local links on core pages are valid', async ({ page, request, baseURL }) => {
  const baseOrigin = new URL(baseURL).origin;
  const failures = [];

  for (const path of PAGES) {
    await page.goto(path);

    const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute('href')).filter(Boolean)
    );

    const localPaths = [...new Set(hrefs
      .map((href) => toLocalPath(href, page.url(), baseOrigin))
      .filter(Boolean))];

    for (const localPath of localPaths) {
      const response = await request.get(localPath);
      if (response.status() >= 400) {
        failures.push(`${path} -> ${localPath} returned ${response.status()}`);
      }
    }
  }

  expect(failures, 'Broken local links found').toEqual([]);
});

test('all local assets referenced by core pages are valid', async ({ page, request, baseURL }) => {
  const baseOrigin = new URL(baseURL).origin;
  const failures = [];

  for (const path of PAGES) {
    await page.goto(path);

    const assetUrls = await page.evaluate(() => {
      const values = [];
      document.querySelectorAll('img[src],script[src],link[href]').forEach((el) => {
        if (el.tagName.toLowerCase() === 'link') {
          const rel = (el.getAttribute('rel') || '').toLowerCase();
          if (rel && rel !== 'stylesheet') return;
        }

        const attr = el.tagName.toLowerCase() === 'link' ? 'href' : 'src';
        const value = el.getAttribute(attr);
        if (value) values.push(value);
      });
      return values;
    });

    const localAssetPaths = [...new Set(assetUrls
      .map((raw) => toLocalPath(raw, page.url(), baseOrigin))
      .filter(Boolean))];

    for (const localPath of localAssetPaths) {
      const response = await request.get(localPath);
      if (response.status() >= 400) {
        failures.push(`${path} -> ${localPath} returned ${response.status()}`);
      }
    }
  }

  expect(failures, 'Broken local assets found').toEqual([]);
});

test.describe('mobile sanity', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('homepage has no horizontal overflow and keeps key controls visible', async ({ page }) => {
    await page.goto('/');

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 1
    );

    expect(hasOverflow, 'Horizontal overflow detected on mobile').toBeFalsy();
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(page.locator('.nav a').first()).toBeVisible();
  });
});
