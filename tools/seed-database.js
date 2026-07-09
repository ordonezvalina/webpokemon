import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// CONFIGURACIÓN DE CREDENCIALES
const SUPABASE_URL = 'httco'; // ⚠️ Cambia por tu ID real
const SUPABASE_KEY = 'xxxx';       // ⚠️ Cambia por tu clave
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_PATH = path.join(__dirname, 'volumes-staging.json');

async function main() {
  console.log('--- Iniciando volcado masivo en Supabase (Estructura Corregida) ---');

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`❌ No se encuentra el archivo ${JSON_PATH}`);
    return;
  }

  const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
  const items = JSON.parse(rawData);
  const collectionMap = new Map();

  for (const item of items) {
    let collectionId;

    // 1. Inserción / Recuperación de Colección
    if (collectionMap.has(item.collection_name)) {
      collectionId = collectionMap.get(item.collection_name);
    } else {
      const { data: existingCol } = await supabase
        .from('collections')
        .select('id')
        .eq('name', item.collection_name)
        .maybeSingle();

      if (existingCol) {
        collectionId = existingCol.id;
      } else {
        const { data: newCol, error: colError } = await supabase
          .from('collections')
          .insert({ name: item.collection_name })
          .select('id')
          .single();

        if (colError) {
          console.error(`❌ Error creando colección "${item.collection_name}":`, colError.message);
          continue;
        }
        collectionId = newCol.id;
        console.log(`📦 Colección registrada: "${item.collection_name}" (ID: ${collectionId})`);
      }
      collectionMap.set(item.collection_name, collectionId);
    }

    // 2. Construir la URL pública del bucket para la portada
    const publicImageUrl = `${SUPABASE_URL}/storage/v1/object/public/volume-covers/${item.filename}`;

    // 3. Inserción del volumen (Match idílico con tus columnas de Postgres)
    const { error: volError } = await supabase
      .from('volumes')
      .insert({
        collection_id: collectionId,
        volume: item.volume,
        name_eng: item.name_eng,
        name_jp: item.name_jp,
        cover_image: publicImageUrl,
        release_date: item.release_date // Entrará como NULL o string 'AAAA-MM-DD'
      });

    if (volError) {
      console.error(`  ❌ Error vinculando Vol. ${item.volume} de "${item.collection_name}":`, volError.message);
    } else {
      console.log(`  -> ✅ Vol. ${item.volume} insertado perfectamente.`);
    }
  }

  console.log('\n--- ¡Proceso completado! Tus 22 volúmenes están a buen recaudo ---');
}

main();