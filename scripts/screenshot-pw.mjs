/**
 * Screenshot script for personal weapon pages.
 * Reads src/data/fps-weapon-personal-list.json, visits each /PW/[ClassName] page,
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

const personalWeaponList = JSON.parse(
  readFileSync(join(rootDir, "src/data/fps-weapon-personal-list.json"), "utf-8")
);

const classNames = personalWeaponList.map((weapon) => weapon.ClassName);
console.log(`Found ${classNames.length} personal weapons to screenshot.`);

const outputDir = join(rootDir, "screenshots", "personal_weapon");
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

const page = await context.newPage();

let successCount = 0;
let failCount = 0;

for (const className of classNames) {
  const url = `${BASE_URL}/PW/${className}?no_animation=1`;
  console.log(`Screenshotting: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

    await page.waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs.every((img) => img.complete);
      },
      { timeout: 30000 }
    );

    const outputPath = join(outputDir, `${className}.png`);
    await page.screenshot({
      path: outputPath,
      fullPage: true,
    });

    console.log(`  Saved: personal_weapon/${className}.png`);
    successCount++;
  } catch (err) {
    console.error(`  Failed for ${className}: ${err.message}`);
    failCount++;
  }
}

await browser.close();
console.log(
  `\nDone. ${successCount} succeeded, ${failCount} failed out of ${classNames.length} personal weapons.`
);

if (failCount > 0) {
  process.exit(1);
}
