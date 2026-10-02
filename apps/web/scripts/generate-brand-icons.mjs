// Generates the brand icons from the owner's logo image (ADR-062):
//   node apps/web/scripts/generate-brand-icons.mjs
//
// The source (src/assets/brand/logo-source.jpg, 1280×960) shows the app tile — a gold "L" with a
// star and a leaf on a black rounded square with a gold frame — above the "LOMERA HOLDING"
// wordmark. Only the tile is used:
// - the rounded tile, transparent outside its frame: the in-app mark, the favicon and the
//   manifest's `any` icons;
// - the letter alone on a full black square: the iOS home screen and the Android maskable
//   icon, whose corners the system cuts itself.
// sharp is a dependency of the API workspace; the web app has no image tooling of its own.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(resolve(webRoot, '../api/package.json'))('sharp');

const SOURCE = resolve(webRoot, 'src/assets/brand/logo-source.jpg');
/** The large tile of the source, to the outer edge of its gold frame (measured). */
const TILE = { left: 389, top: 47, width: 501, height: 471 };
/** The letter, star and leaf inside the tile (measured). */
const MARK = { left: 452, top: 122, width: 377, height: 321 };
/** Rows of the rounded corner, and how far inside the frame's edge the cut runs. */
const CORNER_ROWS = 115;
const INSET = 1.5;
/** A pixel lighter than this is the ivory background around the tile. */
const BACKGROUND_LUMINANCE = 225;

const { data: pixels, info } = await sharp(SOURCE).raw().toBuffer({ resolveWithObject: true });

function luminance(x, y) {
  const index = (y * info.width + x) * info.channels;

  return 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2];
}

/**
 * How far the frame starts from the tile's left edge on each row of the top-left corner. The
 * top-left corner has no drop shadow, so it is read from the image and mirrored to the others.
 */
function cornerProfile() {
  const offsets = [];

  for (let row = 0; row <= CORNER_ROWS; row += 1) {
    let x = TILE.left - 2;

    while (x < TILE.left + TILE.width / 2 && luminance(x, TILE.top + row) >= BACKGROUND_LUMINANCE) {
      x += 1;
    }

    offsets.push(Math.max(0, x - TILE.left));
  }

  return offsets;
}

/** The tile's outline as an SVG polygon in tile coordinates, pulled INSET pixels inwards. */
function tileMask() {
  const { width: w, height: h } = TILE;
  const offsets = cornerProfile();
  const rows = offsets.map((offset, row) => [offset, row]);
  const points = [
    ...rows.map(([x, y]) => [x, y]),
    ...[...rows].reverse().map(([x, y]) => [x, h - y]),
    ...rows.map(([x, y]) => [w - x, h - y]),
    ...[...rows].reverse().map(([x, y]) => [w - x, y]),
  ];
  const sx = 1 - (2 * INSET) / w;
  const sy = 1 - (2 * INSET) / h;
  const polygon = points
    .map(
      ([x, y]) =>
        `${(w / 2 + (x - w / 2) * sx).toFixed(2)},${(h / 2 + (y - h / 2) * sy).toFixed(2)}`,
    )
    .join(' ');

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><polygon points="${polygon}" fill="#fff"/></svg>`,
  );
}

/** The rounded tile on a transparent square canvas (the tile is 6% wider than tall). */
async function roundedTile() {
  const side = TILE.width;
  const tile = await sharp(SOURCE)
    .extract(TILE)
    .ensureAlpha()
    .composite([{ input: tileMask(), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const top = Math.floor((side - TILE.height) / 2);

  return sharp(tile)
    .extend({
      top,
      bottom: side - TILE.height - top,
      left: 0,
      right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/**
 * The black the mark sits on: the median of the dark pixels of a source region. The tile is
 * lighter at its top (gloss) and left, so an average would come out too light.
 */
function backgroundBlack(region) {
  const dark = [];

  for (let y = region.top; y < region.top + region.height; y += 1) {
    for (let x = region.left; x < region.left + region.width; x += 1) {
      if (luminance(x, y) < 40) {
        const index = (y * info.width + x) * info.channels;

        dark.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
      }
    }
  }

  // Channel by channel: the JPEG's dark pixels carry colour noise, one pixel would tint it.
  return [0, 1, 2].map((channel) => {
    const values = dark.map((rgb) => rgb[channel]).sort((a, b) => a - b);

    return values[Math.floor(values.length / 2)] ?? 6;
  });
}

function hex(rgb) {
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The mark alone, centred on a full black square. `share` is the mark's width as a part of
 * the square. The cut-out fades out through a rounded, blurred mask (so the tile's frame at its
 * corners never shows), onto a background of the same black that darkens towards the corners.
 */
async function fullBleed(size, share) {
  const margin = 34;
  const region = {
    left: MARK.left - margin,
    top: MARK.top - margin,
    width: MARK.width + 2 * margin,
    height: MARK.height + 2 * margin,
  };
  const scale = (size * share) / MARK.width;
  const width = Math.round(region.width * scale);
  const height = Math.round(region.height * scale);
  const blur = margin * scale * 0.3;
  const inset = margin * scale * 0.45;
  const fade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur.toFixed(2)}"/></filter>` +
      `<rect x="${inset.toFixed(2)}" y="${inset.toFixed(2)}" width="${(width - 2 * inset).toFixed(2)}" height="${(height - 2 * inset).toFixed(2)}" rx="${(60 * scale).toFixed(2)}" fill="#fff" filter="url(#f)"/></svg>`,
  );
  const mark = await sharp(SOURCE)
    .extract(region)
    .resize(width, height)
    .ensureAlpha()
    .composite([{ input: fade, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const black = backgroundBlack(region);
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      '<defs><radialGradient id="g" cx="0.5" cy="0.47" r="0.72">' +
      `<stop offset="0" stop-color="${hex(black)}"/><stop offset="0.55" stop-color="${hex(black)}"/><stop offset="1" stop-color="#020202"/>` +
      `</radialGradient></defs><rect width="${size}" height="${size}" fill="url(#g)"/></svg>`,
  );

  return sharp(background)
    .composite([
      {
        input: mark,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .flatten({ background: '#020202' })
    .png()
    .toBuffer();
}

/** 256-colour PNG: the gold gradients look the same at a quarter of the size. */
const PNG = { compressionLevel: 9, palette: true, quality: 95, effort: 10 };

const tile = await roundedTile();
const publicDir = resolve(webRoot, 'public');
const assetsDir = resolve(webRoot, 'src/assets/brand');

await mkdir(publicDir, { recursive: true });

const outputs = [
  // In the app: at most 128 px wide (login), so 384 px covers a 3× screen.
  [tile, 384, resolve(assetsDir, 'app-icon.webp'), 'webp'],
  [tile, 32, resolve(publicDir, 'favicon-32.png'), 'png'],
  [tile, 192, resolve(publicDir, 'icon-192.png'), 'png'],
  [tile, 512, resolve(publicDir, 'icon-512.png'), 'png'],
];

for (const [input, size, file, format] of outputs) {
  const image = sharp(input).resize(size, size, { kernel: 'lanczos3' });

  await (
    format === 'webp' ? image.webp({ quality: 90, alphaQuality: 100, effort: 6 }) : image.png(PNG)
  ).toFile(file);
}

// iOS rounds the corners itself and shows transparency as black: a full square.
await sharp(await fullBleed(1024, 0.64))
  .resize(180, 180, { kernel: 'lanczos3' })
  .png(PNG)
  .toFile(resolve(publicDir, 'apple-touch-icon.png'));

// Android masks to a circle or squircle: the mark stays inside the central 80% (safe zone).
await sharp(await fullBleed(1024, 0.56))
  .resize(512, 512, { kernel: 'lanczos3' })
  .png(PNG)
  .toFile(resolve(publicDir, 'icon-maskable-512.png'));

console.log('Brand icons written.');
