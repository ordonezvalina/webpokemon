import fs from 'fs';

const scriptPath = new URL('./download-covers-official.js', import.meta.url);
const scriptText = fs.readFileSync(scriptPath, 'utf8');
const match = scriptText.match(/const\s+SERPAPI_KEY\s*=\s*['"]([^'"]+)['"]/);
const SERPAPI_KEY = match ? match[1] : process.env.SERPAPI_KEY;

if (!SERPAPI_KEY) {
  console.error('No SERPAPI_KEY found');
  process.exit(1);
}

const query = 'ポケモン おうちで！りらくっしょんマスコット タカラトミーアーツ 商品画像 ガチャ';

async function main() {
  const searchUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&num=10`;
  const res = await fetch(searchUrl);
  const data = await res.json();

  if (!data.images_results || data.images_results.length === 0) {
    console.log('No images_results');
    return;
  }

  for (let i = 0; i < Math.min(3, data.images_results.length); i++) {
    const img = data.images_results[i];
    console.log(`\n--- Result ${i} ---`);
    console.log('original:', img.original?.substring(0, 200));
    console.log('thumbnail:', img.thumbnail?.substring(0, 200));
    console.log('source:', img.source);
    console.log('dimensions:', img.original_width, 'x', img.original_height);

    if (img.original) {
      try {
        const imgRes = await fetch(img.original, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': 'https://www.google.com/',
          },
          redirect: 'follow',
        });
        const ct = imgRes.headers.get('content-type');
        const len = imgRes.headers.get('content-length');
        console.log(`fetch original → ${imgRes.status} ${ct} (${len} bytes)`);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        console.log('first 64 bytes hex:', buf.slice(0, 64).toString('hex'));
        if (!ct || !ct.startsWith('image/')) {
          console.log('response starts:', buf.slice(0, 200).toString().replace(/\n/g, ' ').substring(0, 200));
        }
      } catch (e) {
        console.log('fetch error:', e.message);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
