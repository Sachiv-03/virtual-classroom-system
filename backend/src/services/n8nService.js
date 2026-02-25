const https = require('https');

/**
 * Sends a notification to n8n via a webhook.
 * This can be used to trigger external workflows like sending Slack messages,
 * updating CRM, or notifying students via SMS.
 */
exports.triggerWebhook = async (event, data) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('n8n Webhook URL not configured. Skipping notification.');
        return;
    }

    const postData = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        payload: data
    });

    const url = new URL(webhookUrl);

    const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`n8n Webhook context: ${event} - Status: ${res.statusCode}`);
                resolve(body);
            });
        });

        req.on('error', (e) => {
            console.error(`Error triggering n8n webhook: ${e.message}`);
            // We don't want to crash the app if n8n is down
            resolve(null);
        });

        req.write(postData);
        req.end();
    });
};
