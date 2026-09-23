import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';

// The API always runs in UTC, whatever the machine's zone. Every time column is UTC
// (ADR-036) and the Docker image already runs in UTC; without this, `npm run dev` on a
// machine east of UTC (Ashgabat, UTC+5) writes `date` columns one day early, because
// TypeORM parses '2026-09-01' as local midnight and then shifts it again for `utc: true`
// (store_visitor_counts.visit_date, employee_salaries.effective_month). Every entry point
// (main, the migration CLI, schema-check) imports this file first; Node applies a TZ set
// at runtime to every Date after it.
process.env.TZ = 'UTC';

const candidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];

for (const path of candidates) {
  if (existsSync(path)) {
    config({ path, override: false, quiet: true });
    break;
  }
}
