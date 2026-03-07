/**
 * Screenshot script for vehicle pages.
 * Reads src/data/vehicle-basic-list.json, visits each /vehicle/[ClassName] page,
 * and saves a full-page screenshot at 2560px width (200% device scale factor).
 */

import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

// Read vehicle list
const vehicleList = JSON.parse(
  readFileSync(join(rootDir, "src/data/vehicle-basic-list.json"), "utf-8")
);

const classNames = vehicleList.map((v) => v.ClassName);
console.log(`Found ${classNames.length} vehicles to screenshot.`);

// Ensure output directory exists
const outputDir = join(rootDir, "screenshots", "vehicle");
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });

// 200% zoom = deviceScaleFactor of 2, viewport width 1280 CSS px → 2560 physical px
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

const page = await context.newPage();

let successCount = 0;
let failCount = 0;

for (const className of classNames) {
  const url = `${BASE_URL}/vehicle/${className}`;
  console.log(`Screenshotting: ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

    // Wait for all images to finish loading (including errored images)
    await page.waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs.every((img) => img.complete);
      },
      { timeout: 30000 }
    );

    // Get full page height from document
    const pageHeight = await page.evaluate(
      () => document.documentElement.offsetHeight
    );

    // Resize viewport to match full page height before screenshot
    await page.setViewportSize({ width: 1280, height: pageHeight });

    const outputPath = join(outputDir, `${className}.png`);
    await page.screenshot({
      path: outputPath,
      fullPage: false,
    });

    // Reset viewport for next page
    await page.setViewportSize({ width: 1280, height: 900 });

    console.log(`  ✓ Saved: vehicle/${className}.png`);
    successCount++;
  } catch (err) {
    console.error(`  ✗ Failed for ${className}: ${err.message}`);
    failCount++;
  }
}

await browser.close();
console.log(
  `\nDone. ${successCount} succeeded, ${failCount} failed out of ${classNames.length} vehicles.`
);

if (failCount > 0) {
  process.exit(1);
}
