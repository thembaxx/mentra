import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.MENTRA_TEST_URL ?? "http://127.0.0.1:3000";
const widths = [320, 360, 390, 768];
const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader"],
});

await mkdir("test-results/mobile-layout", { recursive: true });

try {
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: 844 },
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });

    try {
      await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.locator('nav[aria-label="Bottom Dock Navigation"]').waitFor();
      await page.locator(".grid.grid-cols-7").first().waitFor();

      // Motion springs are JavaScript-driven: screenshot animations: "disabled"
      // does not guarantee that the landing view has reached full opacity.
      // Wait for the visible final state so captured evidence is reproducible.
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await page.waitForFunction(() => {
        const section = document.querySelector("main > section");
        const heading = document.querySelector("main h1");
        return (
          section &&
          heading &&
          getComputedStyle(section).opacity === "1" &&
          getComputedStyle(heading).opacity === "1"
        );
      });

      const result = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const bound = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return { selector, missing: true };
          const rect = element.getBoundingClientRect();
          return {
            selector,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          };
        };
        return {
          viewport,
          documentWidth: document.documentElement.scrollWidth,
          elements: [
            bound("header"),
            bound("header button"),
            bound("main h1"),
            bound(".grid.grid-cols-7"),
            bound(".grid.grid-cols-7 > div:last-child"),
            bound('nav[aria-label="Bottom Dock Navigation"]'),
            ...Array.from(
              document.querySelectorAll('nav[aria-label="Bottom Dock Navigation"] button'),
            ).map((_, index) =>
              bound(`nav[aria-label="Bottom Dock Navigation"] button:nth-child(${index + 1})`),
            ),
          ],
        };
      });

      await page.screenshot({
        path: `test-results/mobile-layout/mentra-${width}.png`,
        animations: "disabled",
      });

      console.log(JSON.stringify({ requestedWidth: width, ...result }, null, 2));

      assert.ok(
        result.documentWidth <= width + 1,
        `Document overflow at ${width}px: ${result.documentWidth}px`,
      );
      for (const element of result.elements) {
        assert.equal(element.missing, undefined, `Missing: ${element.selector}`);
        assert.ok(
          element.left >= -1 && element.right <= width + 1,
          `Offscreen at ${width}px: ${element.selector} (${element.left}..${element.right})`,
        );
      }
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
