export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const headers = corsHeaders();

  try {
    const payload = await context.request.json();
    const targetUrl = payload && payload.url;

    if (!targetUrl) {
      return jsonResponse({ error: 'Missing url' }, 400, headers);
    }

    const upstream = await fetch(targetUrl, {
      method: payload.method || 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'User-Agent': 'toolrar-blog-admin'
      }, payload.headers || {}),
      body: payload.body || ''
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    if (!upstream.ok) {
      const message = data && data.error && data.error.message
        ? data.error.message
        : (data && data.message ? data.message : 'AI API error: ' + upstream.status);
      return jsonResponse({ error: message, upstream_status: upstream.status }, upstream.status, headers);
    }

    return jsonResponse(data, 200, headers);
  } catch (err) {
    return jsonResponse({ error: err.message || 'AI proxy failed' }, 500, headers);
  }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return onRequestOptions(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders());
}

function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers)
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
