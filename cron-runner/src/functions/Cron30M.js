const { app } = require('@azure/functions');

// Runs every 30 minutes (Azure Functions NCRONTAB format with seconds)
app.timer('Cron30M', {
    schedule: '0 */30 * * * *',
    handler: async (myTimer, context) => {
        const startedAt = new Date().toISOString();
        const url = process.env.CRON_URL || 'http://localhost:3000/api/cron/30mins';
        context.log(`Cron30M triggered at ${startedAt}. Calling: ${url}`);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            const text = await res.text();
            context.log(`Cron30M response status: ${res.status}`);
            context.log(`Cron30M response body: ${text}`);

            if (!res.ok) {
                throw new Error(`Upstream returned ${res.status} ${res.statusText}`);
            }
        } catch (err) {
            context.log.error('Cron30M invocation failed:', err instanceof Error ? err.message : String(err));
            throw err; // surface failure for Monitor/Application Insights
        }
    }
});
