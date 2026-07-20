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
const JSON_PATH = path.join(__dirname, 'releases-staging.json');

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

    // 2. Inserción de la release (cover_image guarda solo el nombre de archivo)
    const { error: relError } = await supabase
      .from('releases')
      .insert({
        collection_id: collectionId,
        number: item.release_number,
        name: item.name,
        cover_image: item.filename,
        release_date: item.release_date // Entrará como NULL o string 'AAAA-MM-DD'
      });

    if (relError) {
      console.error(`  ❌ Error vinculando release ${item.release_number} de "${item.collection_name}":`, relError.message);
    } else {
      console.log(`  -> ✅ Release ${item.release_number} insertada perfectamente.`);
    }
  }

  console.log('\n--- ¡Proceso completado! Tus releases están a buen recaudo ---');
}

main();