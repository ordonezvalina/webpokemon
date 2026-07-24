-- Updates & insert for Pokémon & Egg Pot releases (collection_id = 21)
-- Data sourced from https://www.takaratomy-arts.co.jp/items/item.html?n=<product_code>

-- Pot 1: correct product_code/cover_image for the existing number 1 row
UPDATE releases
SET
    product_code = 'Y874444',
    cover_image = 'Y874444_b.webp',
    release_date = '2019-05-01',
    description = 'Pokémon inside egg-shaped capsules. Includes: Pichu, Eevee, Vulpix, Snowy (Lillie’s Alolan Vulpix).'
WHERE collection_id = 21
  AND number = 1;

-- Pot 2: new release, number 2 does not yet exist
INSERT INTO releases (collection_id, number, product_code, cover_image, release_date, description)
VALUES (
    21,
    2,
    'Y884146',
    'Y884146_b.webp',
    '2020-06-01',
    'Pokémon inside egg-shaped capsules. Includes: Pichu, Slowpoke, Cubone, Riolu.'
);

-- Pot 4: correct product_code/cover_image for the existing number 4 row
UPDATE releases
SET
    product_code = 'Y050800',
    cover_image = 'Y050800_b.webp',
    release_date = '2022-03-01',
    description = 'Pokémon inside egg-shaped capsules. Includes: Mime Jr., Mantyke, Chingling, Budew.'
WHERE collection_id = 21
  AND number = 4;
