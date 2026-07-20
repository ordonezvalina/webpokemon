import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERPAPI_KEY = '472c179baec6f75a6ef338e0a9d35da9556e58a319a6d0bae63d6187813f2077';
const RELEASES_JSON = path.join(__dirname, 'releases-staging.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'release-covers');

const DEFAULT_SUFFIX = 'タカラトミーアーツ 商品画像 ガチャ';

// Mapeo de los releases conocidos de releases-staging.json a sus nombres y datos oficiales.
// Añade aquí nuevas entradas a medida que investigues más series.
const OFFICIAL = {
  'at-home-relaxation-mascot-vol-1.webp': {
    official_name_jp: 'ポケモン おうちで！りらくっしょんマスコット',
    release_date: '2022-10',
    product_code: 'Y060113',
    name: null,
  },
  'at-home-relaxation-mascot-vol-4.webp': {
    official_name_jp: 'ポケモン おうちで！りらくっしょんマスコット Part4',
    release_date: '2024-10',
    product_code: 'Y083051',
    name: 'Part 4',
  },
  'battle-capsule-toys-vol-3.webp': {
    skip: true,
    note: 'No se encontró ficha oficial en Takara Tomy Arts.',
  },
  'diorama-collect-fire-grass-vol-1.webp': {
    official_name_jp: 'ポケモン ジオラマコレクト ほのお＆くさ',
    release_date: '2022-12',
    product_code: 'Y060427',
    name: 'Fire & Grass',
    note: 'Segunda entrega de la serie Diorama Collect.',
  },
  'forest-series-vol-2.webp': {
    official_name_jp: '森のポケモンたち',
    release_date: '2022-02',
    product_code: 'Y050770',
    name: null,
    note: 'La ficha oficial no numera volúmenes; este es el único set.',
  },
  'funit-mascot-vol-7-sinnoh.webp': {
    skip: true,
    official_name_jp: 'ポケモン フニットマスコット7',
    release_date: '2026-04',
    product_code: 'Y098260',
    name: 'Vol. 7',
    note: 'El nombre del archivo indica Sinnoh, pero la vol. 7 oficial no es Sinnoh. Revisar antes de descargar.',
  },
  'good-night-friends-vol-1-everyone-sleeps.webp': {
    official_name_jp: 'ポケモン おやすみフレンズ みんなぐっすり',
    release_date: '2024-07',
    product_code: 'Y078996',
    name: 'Everyone Sleeps',
  },
  'kanto-full-collection-vol-1.webp': {
    official_name_jp: 'ポケモン カントーいっぱいコレクション',
    release_date: '2019-03',
    product_code: 'Y870255',
    name: null,
  },
  'katazun-pokmon-vol-1.webp': {
    official_name_jp: '肩ズンFig. ポケモン',
    release_date: '2021-07',
    product_code: 'Y895258',
    name: null,
  },
  'katazun-pokmon-vol-5.webp': {
    official_name_jp: '肩ズンFig. ポケモン5',
    release_date: '2024-05',
    product_code: 'Y078156',
    name: null,
  },
  'manpuku-pakupaku-mascot-vol-2.webp': {
    official_name_jp: 'ポケモン まんぷくぱくぱくマスコット おかわり',
    release_date: '2020-07',
    product_code: 'Y884665',
    name: 'Okawari',
  },
  'manpuku-pakupaku-mascot-vol-3.webp': {
    official_name_jp: 'ポケモン まんぷくぱくぱくマスコット3',
    release_date: '2025-04',
    product_code: 'Y088469',
    name: null,
  },
  'mini-gacha-pok-machine-vol-1.webp': {
    official_name_jp: 'ポケットモンスター ミニミニガチャポケマシン シンオウ地方のポケモン大集合',
    release_date: '2022-02',
    product_code: 'Y052262',
    name: 'Sinnoh Region',
  },
  'minna-de-awa-awa-mascot-vol-1.webp': {
    official_name_jp: 'ポケモン みんなでアワアワマスコット',
    release_date: '2020-09',
    product_code: 'Y885594',
    name: null,
  },
  'snap-move-vol-2.webp': {
    official_name_jp: 'ポケモン わざすなっぷ いろいろなわざ',
    release_date: '2023-03',
    product_code: 'Y066405',
    name: 'Various Moves',
    note: "Vol. 1 oficial fue 'しっぽをふる'; esta es la segunda entrega 'いろいろなわざ'.",
  },
  'suri-suri-mascot-vol-1.webp': {
    official_name_jp: 'ポケモン すりすりマスコット',
    release_date: '2024-04',
    product_code: 'Y074516',
    name: null,
  },
  'yummy-sweets-mascot-vol-1.webp': {
    official_name_jp: 'ポケモン Yummy!スイーツマスコット',
    release_date: '2022-01',
    product_code: 'Y899799',
    name: null,
  },
  'yummy-sweets-mascot-vol-2.webp': {
    official_name_jp: 'ポケモン Yummy!スイーツマスコット2',
    release_date: '2022-06',
    product_code: 'Y899805',
    name: null,
  },
  'yummy-sweets-mascot-vol-3.webp': {
    official_name_jp: 'ポケモン Yummy!スイーツマスコット3',
    release_date: '2023-05',
    product_code: 'Y066245',
    name: null,
  },
  'yummy-sweets-mascot-vol-5.webp': {
    official_name_jp: 'ポケモン Yummy!スイーツマスコット5',
    release_date: '2024-08',
    product_code: 'Y078880',
    name: null,
  },
  'yummy-sweets-mascot-vol-6.webp': {
    official_name_jp: 'ポケモン Yummy!スイーツマスコット6',
    release_date: '2024-12',
    product_code: 'Y085888',
    name: null,
  },
  'yummy-sweets-mascot-vol-7.webp': {
    official_name_jp: 'ポケモン Yummy!スイーツマスコット7',
    release_date: '2025-09',
    product_code: 'Y094125',
    name: null,
  },
};

function buildSearchQuery(item, official) {
  if (official?.search_query) return official.search_query;
  if (item.official_name_jp) {
    return `${item.official_name_jp} ${DEFAULT_SUFFIX}`;
  }
  const name = item.name || `vol ${item.release_number}`;
  return `${item.collection_name} ${name} Takara Tomy Arts`;
}

const IMAGE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  Referer: 'https://www.google.com/',
};

async function fetchImageCandidates(query) {
  const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(
    query
  )}&api_key=${SERPAPI_KEY}&num=10&tbs=isz:l`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SerpApi HTTP ${response.status}`);
  }
  const data = await response.json();

  const results = data.images_results || [];
  if (results.length === 0) {
    return [];
  }

  const candidates = [];
  for (const img of results) {
    if (img.original) {
      candidates.push({ type: 'original', url: img.original, width: img.original_width });
    }
    if (img.thumbnail) {
      candidates.push({ type: 'thumbnail', url: img.thumbnail });
    }
  }
  return candidates;
}

async function tryFetchImage({ type, url }) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      headers: IMAGE_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return { ok: false, reason: `content-type ${contentType}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 100) {
      return { ok: false, reason: 'buffer too small' };
    }

    // Verifica que sharp pueda decodificarlo
    await sharp(buffer).metadata();
    return { ok: true, buffer };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function downloadAndProcessImage(candidates, outputPath) {
  for (const candidate of candidates) {
    const result = await tryFetchImage(candidate);
    if (!result.ok) {
      console.log(`   ⚠️ ${candidate.type} falló: ${result.reason}`);
      continue;
    }

    await sharp(result.buffer)
      .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 92, lossless: false })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    return (stats.size / 1024).toFixed(1);
  }

  throw new Error('Ninguna imagen candidata pudo descargarse');
}

async function main() {
  const updateStaging = process.argv.includes('--update-staging');
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const download =
    !process.argv.includes('--no-download') &&
    (updateStaging ? process.argv.includes('--download') : true);

  const raw = fs.readFileSync(RELEASES_JSON, 'utf8');
  const items = JSON.parse(raw);

  // Fusionamos los nombres/datos oficiales en el staging
  let changed = false;
  for (const item of items) {
    const official = OFFICIAL[item.filename];
    if (!official) continue;

    for (const key of ['official_name_jp', 'release_date', 'product_code', 'name', 'note']) {
      if (official[key] !== undefined && (item[key] === null || item[key] === undefined)) {
        item[key] = official[key];
        changed = true;
      }
    }
    if (official.skip === true && (item.skip === null || item.skip === undefined)) {
      item.skip = true;
      changed = true;
    }
  }

  if (updateStaging) {
    if (dryRun) {
      console.log(`[dry-run] Se actualizaría ${RELEASES_JSON} (${changed ? 'con cambios' : 'sin cambios'})`);
    } else {
      fs.writeFileSync(RELEASES_JSON, JSON.stringify(items, null, 2), 'utf8');
      console.log(`✅ ${RELEASES_JSON} actualizado`);
    }
    if (!process.argv.includes('--download')) return;
  }

  if (!download) return;

  if (!dryRun && !SERPAPI_KEY) {
    console.error('❌ Define la variable de entorno SERPAPI_KEY o añádela al inicio del script.');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (dryRun) {
    console.log('\n--- Modo simulación: consultas que se usarían ---\n');
  } else {
    console.log('\n--- Iniciando descarga de portadas con nombres oficiales ---\n');
  }

  for (const item of items) {
    const official = OFFICIAL[item.filename] || {};

    if (item.skip || official.skip) {
      console.log(`⏭️  ${item.filename} — saltado (sin ficha oficial / ambiguo)`);
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, item.filename);

    if (!force && fs.existsSync(outputPath)) {
      console.log(`⏭️  ${item.filename} — ya existe (usa --force para sobrescribir)`);
      continue;
    }

    const query = buildSearchQuery(item, official);
    console.log(`🔍 ${item.filename}`);
    console.log(`   query: ${query}`);

    if (dryRun) continue;

    try {
      const candidates = await fetchImageCandidates(query);
      if (candidates.length === 0) {
        console.log(`   ⚠️ Sin resultados de imagen`);
        continue;
      }

      const sizeKb = await downloadAndProcessImage(candidates, outputPath);
      console.log(`   ✅ Guardado (${sizeKb} KB)`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n--- Proceso finalizado ---');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
