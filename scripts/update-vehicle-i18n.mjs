import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_SOURCES = {
  zh: "https://sczh.42kit.com/full/global.ini",
  en: "https://sczh.42kit.com/orginal/global.ini",
};

const CANDIDATE_ENCODINGS = ["utf-8", "utf-16le", "gb18030", "gbk"];

function parseArgs(argv) {
  const options = {
    outDir: resolve("src/i18n/vehicle"),
    sources: { ...DEFAULT_SOURCES },
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--out-dir" && next) {
      options.outDir = resolve(next);
      index += 1;
      continue;
    }

    if (arg === "--zh-source" && next) {
      options.sources.zh = next;
      index += 1;
      continue;
    }

    if (arg === "--en-source" && next) {
      options.sources.en = next;
      index += 1;
      continue;
    }

    if (arg === "--help") {
      console.log(
        [
          "Usage: node scripts/update-vehicle-i18n.mjs [options]",
          "",
          "Options:",
          "  --out-dir <path>     Output directory. Defaults to src/i18n/vehicle",
          "  --zh-source <value>  URL or local path for zh global.ini",
          "  --en-source <value>  URL or local path for en global.ini",
        ].join("\n"),
      );
      process.exit(0);
    }
  }

  return options;
}

async function loadSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  return readFile(resolve(source));
}

function isVehicleNameKey(key) {
  return /^vehicle_name/i.test(key) && !/_short$/i.test(key);
}

function stripVehicleNamePrefix(key) {
  return key.replace(/^vehicle_name/i, "");
}

function sanitizeIniValue(value) {
  return value.replace(/(?:\\r|\\n)+$/g, "").replace(/[\r\n]+$/g, "").trimEnd();
}

function scoreDecodedIni(text) {
  const keyMatches = text.match(/^vehicle_Name(?!.*_short$)[^=\r\n]*=/gm) ?? [];
  const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
  const suspiciousCount = 0;

  return {
    keyMatches: keyMatches.length,
    replacementCount,
    suspiciousCount,
    score: keyMatches.length * 1000 - replacementCount * 25 - suspiciousCount * 5,
  };
}

function decodeIni(buffer) {
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buffer);
  }

  const utf8Text = new TextDecoder("utf-8").decode(buffer);
  if (scoreDecodedIni(utf8Text).keyMatches > 0) {
    return utf8Text;
  }

  const attempts = CANDIDATE_ENCODINGS.map((encoding) => {
    const text = new TextDecoder(encoding).decode(buffer);
    return { encoding, text, ...scoreDecodedIni(text) };
  }).sort((left, right) => right.score - left.score);

  const best = attempts[0];
  if (!best || best.keyMatches === 0) {
    const summary = attempts
      .map((attempt) => `${attempt.encoding}:keys=${attempt.keyMatches},score=${attempt.score}`)
      .join("; ");
    throw new Error(`Unable to decode INI source reliably. Attempts: ${summary}`);
  }

  return best.text;
}

function extractEntriesByIniKey(iniText) {
  const map = new Map();

  for (const rawLine of iniText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";") || line.startsWith("#") || line.startsWith("[")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!isVehicleNameKey(key)) {
      continue;
    }

    const value = sanitizeIniValue(line.slice(separatorIndex + 1).trimStart());
    map.set(stripVehicleNamePrefix(key), value);
  }

  return map;
}

async function loadVehicleList() {
  const vehicleListPaths = [
    resolve("src/data/vehicle-basic-list.json"),
    resolve("src/data/vehicle-main-list.json"),
  ];
  const vehicleListsRaw = await Promise.all(vehicleListPaths.map((path) => readFile(path, "utf8")));
  const vehicleByClassNameLower = new Map();

  for (const vehicleListRaw of vehicleListsRaw) {
    for (const vehicle of JSON.parse(vehicleListRaw)) {
      if (!vehicle?.ClassName || !vehicle?.Name) {
        continue;
      }

      const normalizedClassName = String(vehicle.ClassName).toLowerCase();
      if (!vehicleByClassNameLower.has(normalizedClassName)) {
        vehicleByClassNameLower.set(normalizedClassName, {
          ClassName: vehicle.ClassName,
          Name: vehicle.Name,
        });
      }
    }
  }

  return [...vehicleByClassNameLower.values()];
}

function normalizeClassNameCandidate(iniKey) {
  let className = iniKey;

  // Drop special trailing markers such as ",P".
  className = className.replace(/,.*/, "");

  // Normalize a few casing inconsistencies found in the source INI.
  className = className.replace(/^Misc_/, "MISC_");
  className = className.replace(/^Grin_/, "GRIN_");
  className = className.replace(/^Banu_/, "BANU_");
  className = className.replace(/^ARGO_Mole$/, "ARGO_MOLE");
  className = className.replace(/^RSI_URSA_Medivac$/, "RSI_Ursa_Medivac");
  className = className.replace(/^XNAA_SantokYai$/, "XNAA_SanTokYai");

  // Normalize families where the data source uses a different segment order.
  className = className.replace(/^CRUS_([ACE]\d)_Spirit$/, "CRUS_Spirit_$1");

  // Normalize a few data-backed naming deltas that follow a repeatable pattern in this repo.
  className = className.replace(/^ANVL_C8R_Pisces_Rescue$/, "ANVL_C8R_Pisces");
  className = className.replace(/^KRIG_L22_Alpha_Wolf$/, "KRIG_L22_AlphaWolf");
  className = className.replace(/^RSI_Aurora_SE$/, "RSI_Aurora_GS_SE");

  return className;
}

const CLASS_NAME_EXCEPTIONS = new Map([
  ["ANVL_Hornet_F7A", "ANVL_Hornet_F7A_Mk1"],
  ["ANVL_Hornet_F7CM_Heartseeker_Mk2", "ANVL_Hornet_F7CM_Mk2_Heartseeker"],
  ["ARGO_MPUV_Tractor", "ARGO_MPUV_1T"],
  ["MISC_Starlancer_MAX", "MISC_Starlancer_Max"],
]);

const MANUAL_VEHICLE_TRANSLATIONS = {
  ARGO_CSV_FM: "南船座 CSV-FM",
  CNOU_Pionneer: "联合外域 开拓者",
  CRUS_Genesis_Starliner: "十字军 创世纪 星际客机",
  GATAC_Railen: "盖塔克 锐伦",
  RSI_Orion: "RSI 猎户座",
  TMBL_Ranger_CV: "盾博尔 游骑兵 CV",
  TMBL_Ranger_RC: "盾博尔 游骑兵 RC",
};

function resolveClassName(iniKey, vehicleNameByClassName, vehicleClassNameByLower) {
  const normalizedClassName = normalizeClassNameCandidate(iniKey);
  const exceptionClassName = CLASS_NAME_EXCEPTIONS.get(normalizedClassName);
  if (exceptionClassName) {
    return exceptionClassName;
  }

  if (vehicleNameByClassName.has(normalizedClassName)) {
    return normalizedClassName;
  }

  return vehicleClassNameByLower.get(normalizedClassName.toLowerCase()) ?? normalizedClassName;
}

function buildLocaleEntries(enByIniKey, zhByIniKey, vehicles) {
  const vehicleNameByClassName = new Map(
    vehicles.map((vehicle) => [vehicle.ClassName, vehicle.Name]),
  );
  const vehicleClassNameByLower = new Map(
    vehicles.map((vehicle) => [vehicle.ClassName.toLowerCase(), vehicle.ClassName]),
  );
  const enEntries = new Map();
  const zhEntries = new Map();
  const unmatched = [];

  for (const [iniKey, enValue] of enByIniKey.entries()) {
    const className = resolveClassName(iniKey, vehicleNameByClassName, vehicleClassNameByLower);
    if (!vehicleNameByClassName.has(className)) {
      unmatched.push(iniKey);
      continue;
    }

    const englishName = vehicleNameByClassName.get(className) ?? enValue.trim();
    const zhValue = zhByIniKey.get(iniKey)?.trim();

    enEntries.set(className, englishName);
    if (zhValue) {
      zhEntries.set(className, zhValue);
    }
  }

  for (const vehicle of vehicles) {
    const manualZhValue = MANUAL_VEHICLE_TRANSLATIONS[vehicle.ClassName];
    if (!manualZhValue) {
      continue;
    }

    enEntries.set(vehicle.ClassName, vehicle.Name);
    zhEntries.set(vehicle.ClassName, manualZhValue);
  }

  return {
    unmatched,
    en: Object.fromEntries([...enEntries.entries()].sort(([left], [right]) => left.localeCompare(right))),
    zh: Object.fromEntries([...zhEntries.entries()].sort(([left], [right]) => left.localeCompare(right))),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [zhBuffer, enBuffer] = await Promise.all([
    loadSource(options.sources.zh),
    loadSource(options.sources.en),
  ]);

  const zhByIniKey = extractEntriesByIniKey(decodeIni(zhBuffer));
  const enByIniKey = extractEntriesByIniKey(decodeIni(enBuffer));
  const vehicles = await loadVehicleList();
  const localeEntries = buildLocaleEntries(enByIniKey, zhByIniKey, vehicles);

  await mkdir(options.outDir, { recursive: true });

  for (const locale of ["zh", "en"]) {
    const outputPath = resolve(options.outDir, `${locale}.json`);
    const payload = `${JSON.stringify(localeEntries[locale], null, 2)}\n`;
    await writeFile(outputPath, payload, "utf8");
    console.log(
      `Updated ${basename(outputPath)} with ${Object.keys(localeEntries[locale]).length} entries`,
    );
  }

  console.log(`Skipped ${localeEntries.unmatched.length} ini keys without a rule-backed ClassName match`);
  for (const key of localeEntries.unmatched.slice(0, 20)) {
    console.log(`  - ${key}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
