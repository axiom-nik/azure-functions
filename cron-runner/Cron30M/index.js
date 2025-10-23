'use strict';

const fetch = globalThis.fetch;

module.exports = async function Cron30M(context, myTimer) {
  const startedAt = new Date().toISOString();
  const url = process.env.CRON_URL || 'http://localhost:3000/api/cron/30mins';
  context.log(`Cron30M triggered at ${startedAt}. Calling: ${url}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const body = await response.text();
    context.log(`Cron30M response status: ${response.status}`);
    context.log(`Cron30M response body: ${body}`);

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    context.log.error(
      'Cron30M invocation failed:',
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }
};
