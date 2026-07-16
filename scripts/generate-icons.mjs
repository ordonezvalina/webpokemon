import sharp from "sharp";
import path from "path";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#18181b" rx="64"/>
  <circle cx="256" cy="256" r="190" fill="#d97706"/>
  <text x="256" y="306" text-anchor="middle" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="#ffffff">TP</text>
</svg>
`.trim();

const publicDir = path.resolve(process.cwd(), "public");
const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 }
];

async function main() {
  for (const { name, size } of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
