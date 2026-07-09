import { createClient } from '@supabase/supabase-js';

// SUPABASE CONFIGURATION (Replace with your actual keys)
const SUPABASE_URL = 'my url';
const SUPABASE_KEY = 'my key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Memory cache to prevent redundant API calls for the same species
const speciesCache = {};

// Helper to extract the numerical ID from a PokéAPI URL
const extractIdFromUrl = (url) => url.split('/').filter(Boolean).pop();

// Smart mapping of suffixes to assign forms, collection generations, and full names
function processVariant(slug, baseNames) {
    let form = 'Base';
    let additionalGeneration = null;
    const fullNames = {};

    // Detect common patterns in PokéAPI variant names
    if (slug.endsWith('-alola')) {
        form = 'Alola';
        additionalGeneration = 7;
    } else if (slug.endsWith('-galar')) {
        form = 'Galar';
        additionalGeneration = 8;
    } else if (slug.endsWith('-hisui')) {
        form = 'Hisui';
        additionalGeneration = 8;
    } else if (slug.endsWith('-paldea')) {
        form = 'Paldea';
        additionalGeneration = 9;
    } else if (slug.includes('-mega')) {
        form = 'Mega';
    } else if (slug.endsWith('-gmax')) {
        form = 'Gigantamax';
    }

    // Build the full name map for all languages
    for (const [lang, name] of Object.entries(baseNames)) {
        if (form === 'Base') {
            fullNames[lang] = name;
        } else if (form === 'Mega') {
            if (lang === 'es') fullNames[lang] = `Mega ${name}`;
            else if (lang === 'en') fullNames[lang] = `Mega ${name}`;
            else if (lang === 'ja') fullNames[lang] = `メガ${name}`;
            else fullNames[lang] = `${name} (Mega)`;
        } else {
            // Regional forms (Alola, Galar, etc.)
            if (lang === 'es') fullNames[lang] = `${name} de ${form}`;
            else if (lang === 'en') fullNames[lang] = `${form}an ${name}`; // E.g., Alolan Vulpix
            else if (lang === 'ja') fullNames[lang] = `${getJapanesePrefix(form)}${name}`;
            else fullNames[lang] = `${name} (${form})`;
        }
    }

    return { form, additionalGeneration, fullNames };
}

// Auxiliar for exact Katakana prefixes for regions
function getJapanesePrefix(form) {
    if (form === 'Alola') return 'アローラ';
    if (form === 'Galar') return 'ガラル';
    if (form === 'Hisui') return 'ヒスイ';
    if (form === 'Paldea') return 'パルデア';
    return '';
}

async function startImport() {
    console.log('--- Starting PokéAPI data extraction ---');
    
    try {
        // Fetching all forms and varieties (limit 1600 covers them all)
        const resList = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1600');
        const jsonList = await resList.json();
        const results = jsonList.results;
        
        console.log(`Found ${results.length} Pokémon entries. Processing...`);
        
        const pokemonBatch = [];
        let counter = 0;

        // FIXED: Using 'of' instead of 'de'
        for (const poke of results) { 
            counter++;
            if (counter % 50 === 0) console.log(`Processed ${counter}/${results.length}...`);

            // Skip gimmick entries to keep your visual collection clean
            if (poke.name.includes('-totem') || poke.name.includes('-cap') || poke.name.includes('-battle-bond')) {
                continue;
            }

            const resPoke = await fetch(poke.url);
            const dataPoke = await resPoke.json();
            
            const speciesUrl = dataPoke.species.url;
            const speciesId = extractIdFromUrl(speciesUrl);

            // Fetch species language data if not cached
            if (!speciesCache[speciesId]) {
                const resSpecies = await fetch(speciesUrl);
                const dataSpecies = await resSpecies.json();

                // Base generation from the franchise (e.g., "generation-i" -> 1)
                const genUrl = dataSpecies.generation.url;
                const baseGen = parseInt(extractIdFromUrl(genUrl));

                // Map all official translations provided by PokéAPI
                const languageNames = {};
                dataSpecies.names.forEach(n => {
                    languageNames[n.language.name] = n.name;
                });

                speciesCache[speciesId] = {
                    pokedexNumber: dataSpecies.id,
                    baseGeneration: baseGen,
                    names: languageNames
                };
            }

            const speciesInfo = speciesCache[speciesId];
            
            // Process variants and name formatting
            const { form, additionalGeneration, fullNames } = processVariant(poke.name, speciesInfo.names);
            
            // Priority: assign to your specific regional collection shelf generation
            const finalGeneration = additionalGeneration || speciesInfo.baseGeneration;

            // Pushing data matching the new English schema columns
            pokemonBatch.push({
                id: poke.name,
                pokedex_number: speciesInfo.pokedexNumber,
                form: form,
                generation: finalGeneration,
                names: speciesInfo.names,
                full_names: fullNames
            });
        }

        console.log('\nUploading data to Supabase...');
        
        // Split into smaller batches of 200 to protect Supabase from payload limits
        const batchSize = 200;
        for (let i = 0; i < pokemonBatch.length; i += batchSize) {
            const subBatch = pokemonBatch.slice(i, i + batchSize);
            const { error } = await supabase.from('pokemon').insert(subBatch);
            
            if (error) {
                console.error('Error inserting batch:', error.message);
            } else {
                console.log(`Successfully uploaded from ${i} to ${Math.min(i + batchSize, pokemonBatch.length)}`);
            }
        }

        console.log('\n¡Master catalog imported successfully into the new English schema!');

    } catch (err) {
        console.error('Critical failure in script:', err);
    }
}

startImport();