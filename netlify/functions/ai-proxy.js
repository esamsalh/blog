const https = require('https');
const http = require('http');

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { url, method, headers: requestHeaders, body: requestBody } = body;

    if (!url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing url' }) };
    }

    const result = await forwardRequest({
      url,
      method: method || 'POST',
      headers: requestHeaders || {},
      body: requestBody || ''
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function forwardRequest({ url, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'http:' ? http : https;
    const req = client.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: Object.assign({
        'Content-Type': 'application/json',
        'User-Agent': 'toolrar-blog-admin'
      }, headers || {})
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsedBody.error?.message || parsedBody.message || `AI API error: ${res.statusCode}`));
          } else {
            resolve(parsedBody);
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ raw: data });
          } else {
            reject(new Error(`AI API error: ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
