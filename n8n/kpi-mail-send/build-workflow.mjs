// "KPI mail send" n8n workflow'u ile kaynak dosyaları eşitler (docs/N8N.md).
//
//   node n8n/kpi-mail-send/build-workflow.mjs            query.sql + build-mails.js → kpi-mail-send.json
//   node n8n/kpi-mail-send/build-workflow.mjs --extract  kpi-mail-send.json → query.sql + build-mails.js
//
// kpi-mail-send.json varsa yalnız SQL düğümünün sorgusu ve Code düğümünün kodu değişir; n8n'de
// yapılan diğer ayarlar (düğüm adları, saat, mail düğümü, credential seçimleri) korunur. n8n'den
// dışa aktarılan son hâli kpi-mail-send.json'un yerine koyup --extract ile kaynaklara yazın.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const files = {
  workflow: join(here, 'kpi-mail-send.json'),
  query: join(here, 'query.sql'),
  code: join(here, 'build-mails.js'),
};
const SQL_NODE = 'n8n-nodes-base.microsoftSql';
const CODE_NODE = 'n8n-nodes-base.code';

if (process.argv.includes('--extract')) {
  const workflow = JSON.parse(readFileSync(files.workflow, 'utf8'));

  writeFileSync(files.query, ensureNewline(nodeOf(workflow, SQL_NODE).parameters.query));
  writeFileSync(files.code, ensureNewline(nodeOf(workflow, CODE_NODE).parameters.jsCode));
  console.log(`kpi-mail-send.json → query.sql, build-mails.js`);
} else {
  const workflow = existsSync(files.workflow)
    ? JSON.parse(readFileSync(files.workflow, 'utf8'))
    : template();

  nodeOf(workflow, SQL_NODE).parameters.query = readFileSync(files.query, 'utf8');
  nodeOf(workflow, CODE_NODE).parameters.jsCode = readFileSync(files.code, 'utf8');
  writeFileSync(files.workflow, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(`query.sql, build-mails.js → kpi-mail-send.json`);
}

function nodeOf(workflow, type) {
  const matches = workflow.nodes.filter((node) => node.type === type);

  if (matches.length !== 1) {
    throw new Error(
      `Workflow must have exactly one ${type} node, found ${String(matches.length)}.`,
    );
  }

  return matches[0];
}

function ensureNewline(text) {
  return text.endsWith('\n') ? text : `${text}\n`;
}

/** The first version of the workflow; credentials are chosen in n8n after import. */
function template() {
  const names = {
    trigger: 'Her akşam 22:00',
    query: 'KPI_DB',
    code: 'Mailleri hazırla',
    mail: 'Gmail',
  };

  return {
    // n8n'in CLI içe aktarımı (n8n import:workflow) id ister; arayüzden içe aktarmada yok sayılır.
    id: 'KpiMailSend00001',
    name: 'KPI mail send',
    nodes: [
      {
        parameters: {
          rule: { interval: [{ field: 'days', triggerAtHour: 22, triggerAtMinute: 0 }] },
        },
        id: 'b1f0e7a2-5c41-4d1e-9a51-0c6f3c2a7d01',
        name: names.trigger,
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.3,
        position: [0, 0],
      },
      {
        parameters: { operation: 'executeQuery', query: '', options: {} },
        id: 'b1f0e7a2-5c41-4d1e-9a51-0c6f3c2a7d02',
        name: names.query,
        type: SQL_NODE,
        typeVersion: 1.2,
        position: [240, 0],
      },
      {
        parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: '' },
        id: 'b1f0e7a2-5c41-4d1e-9a51-0c6f3c2a7d03',
        name: names.code,
        type: CODE_NODE,
        typeVersion: 2,
        position: [480, 0],
      },
      {
        parameters: {
          resource: 'message',
          operation: 'send',
          sendTo: '={{ $json.to }}',
          subject: '={{ $json.subject }}',
          emailType: 'html',
          message: '={{ $json.html }}',
          options: { appendAttribution: false, senderName: 'Lorem KPI' },
        },
        id: 'b1f0e7a2-5c41-4d1e-9a51-0c6f3c2a7d04',
        name: names.mail,
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2.2,
        position: [720, 0],
        onError: 'continueRegularOutput',
      },
      {
        parameters: {
          content:
            '## KPI mail send\n' +
            'Her akşam her çalışana kendi KPI puanı, maaştan alacağı ve sıralama tablosu.\n\n' +
            '1. **KPI_DB**: Microsoft SQL credential seçin (salt okunur hesap önerilir).\n' +
            '2. **Gmail**: Gmail credential seçin.\n' +
            '3. Denemek için **Mailleri hazırla** içinde `TEST_RECIPIENT` doldurun.\n\n' +
            'Kaynak: repo `n8n/kpi-mail-send/`, belge: docs/N8N.md',
          height: 260,
          width: 420,
        },
        id: 'b1f0e7a2-5c41-4d1e-9a51-0c6f3c2a7d05',
        name: 'Not',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [0, -320],
      },
    ],
    connections: {
      [names.trigger]: { main: [[{ node: names.query, type: 'main', index: 0 }]] },
      [names.query]: { main: [[{ node: names.code, type: 'main', index: 0 }]] },
      [names.code]: { main: [[{ node: names.mail, type: 'main', index: 0 }]] },
    },
    active: false,
    settings: { executionOrder: 'v1', timezone: 'Asia/Ashgabat' },
    pinData: {},
    tags: [],
  };
}
