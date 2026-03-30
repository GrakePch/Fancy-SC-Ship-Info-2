import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_SOURCES = {
  zh: "https://sczh.42kit.com/full/global.ini",
  en: "https://sczh.42kit.com/orginal/global.ini",
};

const CANDIDATE_ENCODINGS = ["utf-8", "utf-16le", "gb18030", "gbk"];

function parseArgs(argv) {
  const options = {
    outDir: resolve("src/i18n/pw"),
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
          "Usage: node scripts/update-pw-i18n.mjs [options]",
          "",
          "Options:",
          "  --out-dir <path>     Output directory. Defaults to src/i18n/pw",
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

function scoreDecodedIni(text) {
  const keyMatches = text.match(/^item_Name(?!_)[^=\r\n]*=/gm) ?? [];
  const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
  const suspiciousCount = (text.match(/[锟�]/g) ?? []).length;

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

function extractEntries(iniText) {
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
    if (!key.startsWith("item_Name") || key.startsWith("item_Name_")) {
      continue;
    }

    const normalizedKey = key.toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    map.set(normalizedKey, value);
  }

  return Object.fromEntries([...map.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

async function writeLocaleFile(outDir, locale, source) {
  const buffer = await loadSource(source);
  const iniText = decodeIni(buffer);
  const entries = extractEntries(iniText);
  const outputPath = resolve(outDir, `${locale}.json`);
  const payload = `${JSON.stringify(entries, null, 2)}\n`;

  await writeFile(outputPath, payload, "utf8");
  console.log(`Updated ${basename(outputPath)} with ${Object.keys(entries).length} entries from ${source}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  await writeLocaleFile(options.outDir, "zh", options.sources.zh);
  await writeLocaleFile(options.outDir, "en", options.sources.en);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
