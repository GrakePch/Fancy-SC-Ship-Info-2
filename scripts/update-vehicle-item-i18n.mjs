import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_SOURCES = {
  zh: "https://sczh.42kit.com/full/global.ini",
  en: "https://sczh.42kit.com/orginal/global.ini",
};

const CANDIDATE_ENCODINGS = ["utf-8", "utf-16le", "gb18030", "gbk"];

function parseArgs(argv) {
  const options = {
    outDir: resolve("src/i18n/vehicle_item"),
    itemList: resolve("src/data/vehicle-item-list.json"),
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

    if (arg === "--item-list" && next) {
      options.itemList = resolve(next);
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
          "Usage: node scripts/update-vehicle-item-i18n.mjs [options]",
          "",
          "Options:",
          "  --out-dir <path>      Output directory. Defaults to src/i18n/vehicle_item",
          "  --item-list <path>    Vehicle item JSON. Defaults to src/data/vehicle-item-list.json",
          "  --zh-source <value>   URL or local path for zh global.ini",
          "  --en-source <value>   URL or local path for en global.ini",
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

function isItemNameKey(key) {
  return key.startsWith("item_Name") || key.startsWith("item_name");
}

function stripItemNamePrefix(key) {
  return key.replace(/^item_(?:Name|name)/, "");
}

function sanitizeIniValue(value) {
  return value.replace(/(?:\\r|\\n)+$/g, "").replace(/[\r\n]+$/g, "").trimEnd();
}

function scoreDecodedIni(text) {
  const keyMatches = text.match(/^item_(?:Name|name)[^=\r\n]*=/gm) ?? [];
  const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
  const suspiciousCount = (text.match(/[閿燂拷]/g) ?? []).length;

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
    if (!isItemNameKey(key)) {
      continue;
    }

    const value = sanitizeIniValue(line.slice(separatorIndex + 1).trimStart());
    map.set(stripItemNamePrefix(key), value);
  }

  return map;
}

function getClassName(item) {
  return item?.stdItem?.ClassName || item?.className || item?.ClassName;
}

function getEnglishName(item) {
  return item?.stdItem?.Name || item?.name || item?.itemName;
}

function getNameToken(item) {
  if (typeof item?.name !== "string" || !/^@item_(?:Name|name)/.test(item.name)) {
    return undefined;
  }

  return stripItemNamePrefix(item.name.slice(1));
}

async function loadVehicleItems(itemListPath) {
  const itemListRaw = await readFile(itemListPath, "utf8");
  const itemByClassName = new Map();

  for (const item of JSON.parse(itemListRaw)) {
    const className = getClassName(item);
    if (!className || itemByClassName.has(className)) {
      continue;
    }

    itemByClassName.set(className, {
      ClassName: className,
      Name: getEnglishName(item) || className,
      NameToken: getNameToken(item),
    });
  }

  return [...itemByClassName.values()];
}

function resolveValue(item, entriesByIniKey) {
  if (item.NameToken && entriesByIniKey.has(item.NameToken)) {
    return entriesByIniKey.get(item.NameToken);
  }

  return entriesByIniKey.get(item.ClassName);
}

function buildLocaleEntries(enByIniKey, zhByIniKey, items) {
  const enEntries = new Map();
  const zhEntries = new Map();
  const unmatched = [];

  for (const item of items) {
    const enValue = resolveValue(item, enByIniKey);
    const zhValue = resolveValue(item, zhByIniKey);

    if (!enValue && !zhValue) {
      unmatched.push(item.ClassName);
      continue;
    }

    enEntries.set(item.ClassName, enValue?.trim() || item.Name);
    if (zhValue) {
      zhEntries.set(item.ClassName, zhValue.trim());
    }
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
  const items = await loadVehicleItems(options.itemList);
  const localeEntries = buildLocaleEntries(enByIniKey, zhByIniKey, items);

  await mkdir(options.outDir, { recursive: true });

  for (const locale of ["zh", "en"]) {
    const outputPath = resolve(options.outDir, `${locale}.json`);
    const payload = `${JSON.stringify(localeEntries[locale], null, 2)}\n`;
    await writeFile(outputPath, payload, "utf8");
    console.log(
      `Updated ${basename(outputPath)} with ${Object.keys(localeEntries[locale]).length} entries`,
    );
  }

  console.log(
    `Skipped ${localeEntries.unmatched.length} vehicle item ClassNames without an item_Name match`,
  );
  for (const className of localeEntries.unmatched.slice(0, 20)) {
    console.log(`  - ${className}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
