import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const baseURL = process.env.BROWSER_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const output = "test-artifacts/mentra-hero";
mkdirSync(output, { recursive: true });

try {
  for (const [name, width, height] of [
    ["mobile", 390, 844],
    ["desktop", 1440, 900],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(() => {
      const nativeGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (typeof type === "string" && /^(webgl|experimental-webgl)/i.test(type)) return null;
        return nativeGetContext.call(this, type, ...args);
      };
    });
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    const artwork = page.locator('svg[viewBox="0 0 640 420"]');
    await artwork.waitFor({ state: "visible", timeout: 25000 });
    const box = await artwork.boundingBox();
    assert.ok(box && box.width > 120 && box.height > 80, name + " fallback must be visible");
    assert.equal(await page.locator('.hero-intro canvas').count(), 0, "WebGL is forced off");
    await artwork.screenshot({ path: output + "/" + name + ".png", animations: "disabled" });
    console.log("PASS", name, "fallback", Math.round(box.width) + "x" + Math.round(box.height));
    await context.close();
  }
} finally {
  await browser.close();
}
