import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// CONFIGURACIÓN: Pega aquí tu clave de SerpApi
const SERPAPI_KEY = 'xxx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, 'releases-staging.json');

// Tus 22 archivos validados
const validFiles = [
  "at-home-relaxation-mascot-vol-1.webp",
  "at-home-relaxation-mascot-vol-4.webp",
  "battle-capsule-toys-vol-3.webp",
  "diorama-collect-fire-grass-vol-1.webp",
  "forest-series-vol-2.webp",
  "funit-mascot-vol-7-sinnoh.webp",
  "good-night-friends-vol-1-everyone-sleeps.webp",
  "kanto-full-collection-vol-1.webp",
  "katazun-pokmon-vol-1.webp",
  "katazun-pokmon-vol-5.webp",
  "manpuku-pakupaku-mascot-vol-2.webp",
  "manpuku-pakupaku-mascot-vol-3.webp",
  "mini-gacha-pok-machine-vol-1.webp",
  "minna-de-awa-awa-mascot-vol-1.webp",
  "snap-move-vol-2.webp",
  "suri-suri-mascot-vol-1.webp",
  "yummy-sweets-mascot-vol-1.webp",
  "yummy-sweets-mascot-vol-2.webp",
  "yummy-sweets-mascot-vol-3.webp",
  "yummy-sweets-mascot-vol-5.webp",
  "yummy-sweets-mascot-vol-6.webp",
  "yummy-sweets-mascot-vol-7.webp"
];

// Capitalizar texto de forma limpia
const capitalize = (str) => str.replace(/\b\w/g, l => l.toUpperCase());

// Parsear el nombre del archivo mediante Regex para extraer su estructura básica
function parseReleaseFile(filename) {
  const match = filename.match(/^(.+?)-vol-(\d+)(?:-(.+))?\.webp$/);
  if (!match) return null;

  const rawCollection = match[1].replace(/-/g, ' ');
  const releaseNum = parseInt(match[2], 10);
  const rawSubtitle = match[3] ? match[3].replace(/-/g, ' ') : null;

  const collectionName = capitalize(rawCollection);
  const subtitleName = rawSubtitle ? capitalize(rawSubtitle) : null;
  
  const releaseStr = subtitleName ? `Release ${releaseNum} ${subtitleName}` : `Release ${releaseNum}`;
  const searchQuery = `Takara Tomy Arts Pokémon ${collectionName} ${releaseStr}`;

  return {
    filename,
    collection_name: collectionName,
    release_number: releaseNum,
    name: subtitleName,
    search_query: searchQuery
  };
}

async function searchReleaseMetadata(item) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(item.search_query)}&api_key=${SERPAPI_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    let releaseYear = null;
    let originalNameJa = null;
    
    if (data.organic_results && data.organic_results.length > 0) {
      // Concatenamos los títulos y snippets de los 3 primeros resultados orgánicos
      const textPool = data.organic_results
        .slice(0, 3)
        .map(r => `${r.title} ${r.snippet}`)
        .join(' ');

      // 1. Expresión regular para cazar años lógicos de lanzamiento (entre 1996 y 2026)
      const yearRegex = /\b(199[6-9]|20[0-2]\d)\b/g;
      const yearsFound = textPool.match(yearRegex);
      if (yearsFound) {
        // Nos quedamos con el primer año que detecte
        releaseYear = parseInt(yearsFound[0], 10);
      }

      // 2. Expresión regular para capturar bloques de texto en japonés (Kanji, Hiragana y Katakana)
      const jaRegex = /([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF][\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\d「」]+)/g;
      const jaMatches = textPool.match(jaRegex);
      if (jaMatches) {
        // Escogemos la coincidencia más larga que probablemente sea el nombre del set completo
        const longestJa = jaMatches.reduce((a, b) => a.length > b.length ? a : b, "");
        if (longestJa.trim().length > 3) {
          originalNameJa = longestJa.trim();
        }
      }
    }

    return {
      filename: item.filename,
      collection_name: item.collection_name,
      release_number: item.release_number,
      name: item.name,
      release_year: releaseYear,
      original_name_ja: originalNameJa
    };

  } catch (error) {
    console.error(`  ❌ Error buscando datos para ${item.filename}:`, error.message);
    return {
      filename: item.filename,
      collection_name: item.collection_name,
      release_number: item.release_number,
      name: item.name,
      release_year: null,
      original_name_ja: null
    };
  }
}

async function main() {
  console.log('--- Extrayendo Metadatos de Google (Años y Nombres Japoneses) ---');
  const stagingData = [];

  for (const filename of validFiles) {
    const parsed = parseReleaseFile(filename);
    if (!parsed) {
      console.log(`⚠️ Archivo omitido por formato no reconocido: ${filename}`);
      continue;
    }

    console.log(`Analizando web para: "${parsed.collection_name} Release ${parsed.release_number}"...`);
    const metadata = await searchReleaseMetadata(parsed);
    stagingData.push(metadata);

    // Espera de seguridad de 1 segundo para la API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Guardamos los datos estructurados en un archivo JSON local limpio
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stagingData, null, 2), 'utf-8');
  console.log(`\n--- Fichero de staging creado con éxito en: ${OUTPUT_FILE} ---`);
  console.log('Abre el archivo "releases-staging.json" para revisar y ajustar los datos antes de subirlos.');
}

main();