import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("decorative 3D hero pauses on reduced motion, inactive tabs and offscreen layouts", () => {
  const src = readFileSync(new URL("../components/HeroThreeScene.tsx", import.meta.url), "utf8");
  for (const part of [
    "prefers-reduced-motion: reduce",
    'document.addEventListener("visibilitychange", updateLoop)',
    "new IntersectionObserver(",
    "resizeObserver?.disconnect()",
    "observer?.disconnect()",
    'reduceMotion.removeEventListener("change", updateLoop)',
    'renderer.domElement.removeEventListener("webglcontextrestored", handleCanvasRestore)',
    "cancelAnimationFrame(frameId)",
    'aria-hidden="true"',
  ]) assert.ok(src.includes(part), part);
  assert.ok(!src.includes('frameId = requestAnimationFrame(animate);\n      const dt'), "no endless render loop before animation conditions");
});
