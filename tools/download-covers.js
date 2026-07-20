import { Buffer } from 'node:buffer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// CONFIGURACIÓN: Pega aquí tu clave de SerpApi
const SERPAPI_KEY = 'xxx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'public', 'release-covers');

const collectionsData = [
  { name: "Yummy! Sweets Mascot", releases: [{ num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }, { num: 5 }, { num: 6 }, { num: 7 }] },
  { name: "Katazun Pokémon", releases: [{ num: 2 }, { num: 3 }, { num: 4 }, { num: 5 }] },
  { name: "At Home! Relaxation Mascot", releases: [{ num: 2 }, { num: 3 }, { num: 4 }] },
  { name: "Forest Series", releases: [{ num: 1 }, { num: 2 }] },
  { name: "Funit Mascot", releases: [{ num: 1 }, { num: 2, name: "Sinnoh" }] },
  { name: "Minna de Awa Awa Mascot", releases: [{ num: 1 }, { num: 2 }] },
  { name: "Netsuke Mascot", releases: [{ num: 1, name: "Side Legend Battle Side-A" }] },
  { name: "Suri Suri Mascot", releases: [{ num: 2 }] },
  { name: "Gira Gira Sunshine", releases: [{ num: 3 }] },
  { name: "Snap Move", releases: [{ num: 2 }] },
  { name: "Capsule Act", releases: [{ num: 1, name: "Sinnoh Regional" }] },
  { name: "Battle Capsule Toys", releases: [{ num: 3 }] },
  { name: "Good Night Friends", releases: [{ num: 1, name: "Everyone Sleeps" }] },
  { name: "Minnade Taiyatobi Mascot", releases: [{ num: 1 }] },
  { name: "Minnade Hoka Hoka", releases: [{ num: 1 }] },
  { name: "Minna de Ouen", releases: [{ num: 1, name: "Everyone Cheering Mascot" }] },
  { name: "Harahara Fallen Leaves Play", releases: [{ num: 1 }] },
  { name: "Diorama Collect Fire & Grass", releases: [{ num: 1 }] },
  { name: "Kanto Full Collection", releases: [{ num: 1 }] },
  { name: "Manpuku Pakupaku Mascot", releases: [{ num: 2 }] },
  { name: "Petanko Mascot", releases: [{ num: 1 }] },
  { name: "Egg Pot", releases: [{ num: 4 }] },
  { name: "Nuku Nuku Time", releases: [{ num: 2 }] },
  { name: "Happy Halloween Mascot", releases: [{ num: 1 }] },
  { name: "Sprigatito Collection", releases: [{ num: 1, name: "Various Gestures" }] },
  { name: "Tomy Arts Tail", releases: [{ num: 1 }] },
  { name: "Coco Movie", releases: [{ num: 1 }] },
  { name: "Gengar Series", releases: [{ num: 1 }] },
  { name: "Mini Gacha Poké Machine", releases: [{ num: 1 }] },
  { name: "Moncolle Box", releases: [{ num: 5 }] }
];

function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

async function downloadAndProcessImage(url, outputFilename) {
  const outputPath = path.join(OUTPUT_DIR, outputFilename);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // MEJORA: Subimos a 1000px de resolución máxima y un 92% de calidad para evitar pérdidas visuales
    await sharp(buffer)
      .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 92, lossless: false })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const fileSizeInKb = (stats.size / 1024).toFixed(1);
    console.log(`  ✅ Guardada: ${outputFilename} (${fileSizeInKb} KB)`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error al procesar imagen de ${url}:`, error.message);
    return false;
  }
}

async function fetchSerpApiImageUrl(searchQuery) {
  const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(searchQuery)}&api_key=${SERPAPI_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.images_results && data.images_results.length > 0) {
      // MEJORA: Buscamos en los resultados la primera imagen que tenga al menos 600px de ancho para asegurar calidad
      const goodImage = data.images_results.find(img => img.original_width >= 600);
      
      if (goodImage) {
        return goodImage.original;
      }
      
      // Si ninguna cumple, cogemos la primera por descarte pero avisamos
      console.log(`  ⚠️ Alerta: No se encontró ninguna opción en alta resolución. Usando fallback.`);
      return data.images_results[0].original; 
    }
    return null;
  } catch (error) {
    console.error(`  ❌ Error en SerpApi para "${searchQuery}":`, error.message);
    return null;
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('--- Iniciando descarga de portadas EN ALTA CALIDAD ---');

  for (const collection of collectionsData) {
    for (const release of collection.releases || []) {
      const releaseStr = release.name ? `Release ${release.num} ${release.name}` : `Release ${release.num}`;
      const searchQuery = `Takara Tomy Arts Pokémon ${collection.name} ${releaseStr} capsule toy`;
      
      const fileSlug = slugify(`${collection.name} ${releaseStr}`);
      const outputFilename = `${fileSlug}.webp`;

      console.log(`Buscando: "${searchQuery}"...`);

      const imageUrl = await fetchSerpApiImageUrl(searchQuery);
      
      if (imageUrl) {
        await downloadAndProcessImage(imageUrl, outputFilename);
      } else {
        console.log(`  ⚠️ No se encontraron imágenes para: ${searchQuery}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n--- ¡Listo! Revisa la carpeta con las nuevas imágenes optimizadas ---');
}

main();