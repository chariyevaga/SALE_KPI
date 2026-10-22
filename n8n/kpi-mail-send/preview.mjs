// Mailleri n8n olmadan üretir ve HTML olarak yazar (docs/N8N.md "Önizleme").
//
//   node n8n/kpi-mail-send/preview.mjs [payload.json] [--lang tr|en|ru|tk] [--out klasör]
//
// payload.json: query.sql'in döndürdüğü [payload] değeri; verilmezse sample-payload.json.
// Her alıcı için <klasör>/<n>.html ve hepsini listeleyen index.html yazılır.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);

  return index === -1 ? fallback : args.splice(index, 2)[1];
};
const language = option('--lang', 'tr');
const outDir = resolve(option('--out', join(here, 'preview')));
const payloadPath = resolve(args[0] ?? join(here, 'sample-payload.json'));

const source = readFileSync(join(here, 'build-mails.js'), 'utf8').replace(
  /^const LANGUAGE = '[a-z]+';/m,
  `const LANGUAGE = '${language}';`,
);
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const run = new AsyncFunction('$input', source);
const payload = readFileSync(payloadPath, 'utf8');
const items = await run({ first: () => ({ json: { payload } }) });

mkdirSync(outDir, { recursive: true });

const links = items.map(({ json }, index) => {
  const file = `${String(index + 1)}.html`;

  writeFileSync(join(outDir, file), json.html);
  console.log(
    `${file}  ${json.to}  ${json.subject}  (${String(Buffer.byteLength(json.html))} bayt)`,
  );

  return `<li><a href="${file}">${escapeHtml(json.subject)}</a> — ${escapeHtml(json.to)}</li>`;
});

writeFileSync(
  join(outDir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>KPI mail önizleme</title><ul>${links.join('')}</ul>`,
);
console.log(`${String(items.length)} mail → ${outDir}`);

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => `&#${String(char.charCodeAt(0))};`);
}
