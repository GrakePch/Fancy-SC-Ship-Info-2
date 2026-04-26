import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HANGAR_ORIGIN = "https://hangar.link";
const MAIN_JS_URL = `${HANGAR_ORIGIN}/main.dart.js`;
const CDN_BASE_URL = process.env.FLEETVIEWER_CDN_BASE_URL || "https://cdn1.fleetviewer.link";
const USER_AGENT =
  process.env.VEHICLE_IMAGE_USER_AGENT ||
  "SCShipInfo2 vehicle image mirror (https://github.com/GrakePCH/SCShipInfo2)";

const SOURCE_SIZE_PRIORITY = ["xxl", "xl", "l", "s", "xs"];
const OUTPUT_SIZE_PRIORITY = ["xs", "s", "l", "xl", "xxl"];
const DEFAULT_VIEWS = ["iso", "top"];
const WEBP_QUALITY = Number(process.env.VEHICLE_IMAGE_WEBP_QUALITY || 88);
const DOWNLOAD_CONCURRENCY = Number(process.env.VEHICLE_IMAGE_DOWNLOAD_CONCURRENCY || 3);
const DOWNLOAD_DELAY_MS = Number(process.env.VEHICLE_IMAGE_DOWNLOAD_DELAY_MS || 250);

const SLUG_OVERRIDES = {
  ANVL_C8R_Pisces: "c8r",
  ANVL_Hornet_F7A_Mk1: "f7a-hornet",
  ANVL_Hornet_F7A_Mk2: "f7a-mkii",
  ANVL_Hornet_F7C: "f7c-hornet",
  ANVL_Hornet_F7C_Mk2: "f7c-mkii",
  ANVL_Hornet_F7CM: "f7c-m-super-hornet",
  ANVL_Hornet_F7CM_Heartseeker: "f7c-m-super-hornet-heartseeker",
  ANVL_Hornet_F7CM_Mk2_Heartseeker: "f7cm-hornet-heartseeker-mkii",
  AEGS_Gladius_PIR: "pirate-gladius",
  AEGS_Retaliator: "retaliator-bomber",
  CNOU_Pionneer: "pioneer",
  CRUS_Starfighter_Inferno: "ares-inferno",
  CRUS_Starfighter_Ion: "ares-ion",
  CRUS_Starlifter_A2: "a2-hercules",
  CRUS_Starlifter_C2: "c2-hercules",
  CRUS_Starlifter_M2: "m2-hercules",
  DRAK_Dragonfly: "dragonfly-black",
  KRIG_L22_AlphaWolf: "l22-alphawolf",
  KRIG_P72_Archimedes: "p72-archimedes",
  ORIG_600i: "600i-explorer",
  ORIG_85X: "85x",
  ORIG_m50: "m50",
  ORIG_x1: "x1-base",
  RSI_Aurora_MK2: "aurora-mk-ii",
  RSI_Polaris_FW: "polaris",
  RSI_Ursa_Rover: "ursa-rover",
  RSI_Zeus_CL: "zeus-mkii-cl",
  RSI_Zeus_ES: "zeus-mkii-es",
  RSI_Zeus_MR: "zeus-mkii-mr",
  TMBL_Storm_AA: "stormaa",
};

const args = parseArgs(process.argv.slice(2));
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(rootDir, args.outDir || "generated/vehicles");
const vehicleListPath = resolve(rootDir, args.vehicleList || "src/data/vehicle-basic-list.json");
const views = (args.views || DEFAULT_VIEWS.join(","))
  .split(",")
  .map((view) => view.trim())
  .filter(Boolean);
const limit = args.limit ? Number(args.limit) : null;
const force = Boolean(args.force);
const dryRun = Boolean(args.dryRun);

await main();

async function main() {
  const previousManifest = await readPreviousManifest(args.previousManifest);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const shipsAssetPath = await discoverShipsAssetPath();
  const shipsJsonUrl = `${HANGAR_ORIGIN}/assets/${shipsAssetPath}`;
  const ships = await fetchJson(shipsJsonUrl);
  const shipsVersion = shipsAssetPath.match(/ships(\d+)\.json/)?.[1] ?? null;
  const shipsBySlug = new Map(ships.map((ship) => [ship.slug, ship]));

  const vehicleList = JSON.parse(await readFile(vehicleListPath, "utf8"));
  const selectedVehicles = limit ? vehicleList.slice(0, limit) : vehicleList;

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseUrl: process.env.R2_PUBLIC_BASE_URL || "",
    source: {
      mainJsUrl: MAIN_JS_URL,
      shipsJsonUrl,
      shipsVersion,
      cdnBaseUrl: CDN_BASE_URL,
    },
    options: {
      views,
      sourceSizePriority: SOURCE_SIZE_PRIORITY,
      outputSizePriority: OUTPUT_SIZE_PRIORITY,
      webpQuality: WEBP_QUALITY,
    },
    byClassName: {},
    vehicles: {},
    missing: [],
  };

  const tasks = [];

  for (const vehicle of selectedVehicles) {
    const resolved = resolveShip(vehicle, shipsBySlug);

    if (!resolved.ship) {
      manifest.missing.push({
        className: vehicle.ClassName,
        name: vehicle.Name,
        candidateSlug: resolved.candidateSlug,
        reason: "ship-slug-not-found",
      });
      continue;
    }

    const { ship } = resolved;
    const variant = ship.variants?.find((item) => item.slug === "");

    if (!variant) {
      manifest.missing.push({
        className: vehicle.ClassName,
        name: vehicle.Name,
        slug: ship.slug,
        reason: "default-variant-not-found",
      });
      continue;
    }

    manifest.byClassName[vehicle.ClassName] = ship.slug;
    manifest.vehicles[ship.slug] = {
      className: vehicle.ClassName,
      name: vehicle.Name,
      sourceName: ship.name,
      slug: ship.slug,
      views: {},
    };

    for (const view of views) {
      const source = pickBestSource(variant, view);
      const targets = pickTargets(variant, view);

      if (!source || targets.length === 0) {
        manifest.missing.push({
          className: vehicle.ClassName,
          name: vehicle.Name,
          slug: ship.slug,
          view,
          reason: "view-image-not-found",
        });
        continue;
      }

      const images = Object.fromEntries(
        targets.map((target) => [
          target.size,
          `${ship.slug}/${view}/${target.size}_${source.hash}.webp`,
        ]),
      );

      manifest.vehicles[ship.slug].views[view] = {
        source,
        images,
      };

      const previousHash = previousManifest?.vehicles?.[ship.slug]?.views?.[view]?.source?.hash;
      if (!force && previousHash === source.hash) {
        continue;
      }

      tasks.push({
        shipSlug: ship.slug,
        variantSlug: variant.slug,
        view,
        source,
        targets,
      });
    }
  }

  const stats = dryRun
    ? { completed: 0, failed: 0 }
    : await runWithConcurrency(tasks, DOWNLOAD_CONCURRENCY, processImageTask);
  const manifestPath = join(outDir, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Ships JSON: ${shipsJsonUrl}`);
  console.log(`Vehicles selected: ${selectedVehicles.length}`);
  console.log(`Vehicles matched: ${Object.keys(manifest.vehicles).length}`);
  console.log(`Missing entries: ${manifest.missing.length}`);
  console.log(`Image tasks queued: ${tasks.length}`);
  console.log(`Image tasks processed: ${stats.completed}`);
  console.log(`Image tasks failed: ${stats.failed}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Manifest written: ${manifestPath}`);

  if (stats.failed > 0) {
    process.exitCode = 1;
  }
}

async function processImageTask(task) {
  const imageUrl = buildSourceImageUrl(task);
  const imageBuffer = await fetchBuffer(imageUrl);

  for (const target of task.targets) {
    const outputPath = join(
      outDir,
      task.shipSlug,
      task.view,
      `${target.size}_${task.source.hash}.webp`,
    );
    await mkdir(dirname(outputPath), { recursive: true });
    await sharp(imageBuffer)
      .resize({
        width: target.width,
        height: target.height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);
  }

  return task;
}

function buildSourceImageUrl(task) {
  const variantPart = task.variantSlug || "";
  return `${CDN_BASE_URL}/${task.shipSlug}_${variantPart}_${task.source.key}_${task.source.hash}.png`;
}

function pickBestSource(variant, view) {
  for (const size of SOURCE_SIZE_PRIORITY) {
    const key = `${view}_${size}`;
    const image = variant[key];

    if (image?.hash && image?.w && image?.h) {
      return {
        key,
        size,
        hash: image.hash,
        width: image.w,
        height: image.h,
      };
    }
  }

  return null;
}

function pickTargets(variant, view) {
  return OUTPUT_SIZE_PRIORITY.map((size) => {
    const key = `${view}_${size}`;
    const image = variant[key];

    if (!image?.hash || !image?.w || !image?.h) {
      return null;
    }

    return {
      key,
      size,
      hash: image.hash,
      width: image.w,
      height: image.h,
    };
  }).filter(Boolean);
}

function resolveShip(vehicle, shipsBySlug) {
  const candidates = [
    SLUG_OVERRIDES[vehicle.ClassName],
    slugFromVehicleName(vehicle.Name),
    slugFromVehicleName(vehicle.Name).replace(/-mk-i$/i, ""),
  ].filter(Boolean);

  const uniqueCandidates = [...new Set(candidates)];
  const candidateSlug = uniqueCandidates[0] || "";

  for (const slug of uniqueCandidates) {
    const ship = shipsBySlug.get(slug);
    if (ship) {
      return { ship, candidateSlug: slug };
    }
  }

  return { ship: null, candidateSlug };
}

function slugFromVehicleName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/);

  if (parts.length > 1) {
    parts.shift();
  }

  return parts
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("'", "-")
    .replaceAll(".", "-")
    .toLowerCase()
    .trim();
}

async function discoverShipsAssetPath() {
  const mainJs = await fetchText(MAIN_JS_URL);
  const matches = [...mainJs.matchAll(/assets\/ships(\d+)\.json/g)];

  if (matches.length === 0) {
    throw new Error(`Could not find assets/ships*.json in ${MAIN_JS_URL}`);
  }

  matches.sort((a, b) => Number(b[1]) - Number(a[1]));
  return matches[0][0];
}

async function readPreviousManifest(path) {
  if (!path) {
    return null;
  }

  const manifestPath = resolve(rootDir, path);

  try {
    await access(manifestPath);
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const response = await fetchWithRetry(url);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url);
  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetchWithRetry(url);
  return Buffer.from(await response.arrayBuffer());
}

async function fetchWithRetry(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "*/*",
    },
  });

  if (response.ok) {
    return response;
  }

  const retryable = response.status === 429 || response.status >= 500;
  if (!retryable || attempt >= 3) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} ${url}`);
  }

  const waitMs = 2 ** attempt * 1000;
  await sleep(waitMs);
  return fetchWithRetry(url, attempt + 1);
}

async function runWithConcurrency(tasks, concurrency, worker) {
  let index = 0;
  let completed = 0;
  let failed = 0;

  async function next() {
    while (index < tasks.length) {
      const task = tasks[index++];

      try {
        await worker(task);
        completed += 1;
        console.log(`processed ${task.shipSlug}/${task.view}`);
      } catch (error) {
        failed += 1;
        console.error(`failed ${task.shipSlug}/${task.view}: ${error.message}`);
      }

      if (DOWNLOAD_DELAY_MS > 0) {
        await sleep(DOWNLOAD_DELAY_MS);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, next));
  return { completed, failed };
}

function parseArgs(argv) {
  const parsed = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
    } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      parsed[key] = argv[i + 1];
      i += 1;
    } else {
      parsed[key] = true;
    }
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}
