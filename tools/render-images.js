// Renders og-image.png, favicon-32.png and apple-touch-icon.png from their sources.
// Needs Playwright with Chromium: run from the repo root with `node tools/render-images.js`.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
const url = (f) => "file://" + path.join(root, f);

(async () => {
  const browser = await chromium.launch();

  // Open Graph image, 1200x630.
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto(url("tools/og-image.html"), { waitUntil: "networkidle" });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: path.join(root, "og-image.png") });

  // PNG icons from favicon.svg (for browsers and iOS home screens that skip SVG).
  // The SVG is inlined: a blank page may not load file:// images.
  const svg = fs.readFileSync(path.join(root, "favicon.svg"), "utf8");
  for (const [file, size, pad, bg] of [["favicon-32.png", 32, 0, null], ["apple-touch-icon.png", 180, 14, "#ffffff"]]) {
    const p = await browser.newPage({ viewport: { width: size, height: size } });
    await p.setContent(
      `<html><body style="margin:0;background:${bg || "transparent"};display:grid;place-items:center;width:${size}px;height:${size}px">` +
      `<div style="width:${size - pad * 2}px;height:${size - pad * 2}px">${svg.replace("<svg ", '<svg width="100%" height="100%" ')}</div>` +
      `<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@800&display=swap" rel="stylesheet"></body></html>`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForLoadState("networkidle");
    await p.screenshot({ path: path.join(root, file), omitBackground: !bg });
  }

  await browser.close();
  console.log("Wrote og-image.png, favicon-32.png, apple-touch-icon.png");
})();
