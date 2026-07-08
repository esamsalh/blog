export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders();

  try {
    const token = env.GITHUB_TOKEN;
    if (!token) {
      return json({ error: 'GitHub token not configured' }, 500, headers);
    }

    const body = await request.json();
    const { owner, repo, branch, action, path, message, content, files } = body;

    if (!owner || !repo || !branch) {
      return json({ error: 'Missing required parameters: owner, repo, branch' }, 400, headers);
    }

    if (action === 'write') {
      if (!path || !message || typeof content !== 'string') {
        return json({ error: 'Missing required: path, message, content' }, 400, headers);
      }
      const result = await writeFile({ owner, repo, branch, path, message, content, token });
      return json(result, 200, headers);
    }

    if (action === 'write-batch') {
      if (!Array.isArray(files) || files.length === 0 || !message) {
        return json({ error: 'Missing required: files, message' }, 400, headers);
      }

      const results = [];
      for (const file of files) {
        if (!file.path || typeof file.content !== 'string') {
          return json({ error: 'Each file requires path and content' }, 400, headers);
        }
        const result = await writeFile({
          owner,
          repo,
          branch,
          path: file.path,
          message: file.message || message,
          content: file.content,
          encoding: file.encoding,
          token
        });
        results.push({ path: file.path, result });
      }

      return json({ ok: true, results }, 200, headers);
    }

    return json({ error: 'Invalid action' }, 400, headers);
  } catch (err) {
    return json({ error: err.message }, 500, headers);
  }
}

async function writeFile({ owner, repo, branch, path, message, content, encoding, token }) {
  let sha = null;
  try {
    const existing = await githubRequest(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      token
    );
    sha = existing.sha;
  } catch (err) {}

  const payload = {
    message,
    branch,
    content: encoding === 'base64' ? content : btoa(unescape(encodeURIComponent(content)))
  };
  if (sha) payload.sha = sha;

  return githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    }
  );
}

async function githubRequest(url, token, init) {
  const res = await fetch(url, {
    method: (init && init.method) || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'toolrar-blog-admin'
    },
    body: init && init.body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `GitHub API error: ${res.status}`);
  }
  return data;
}

function json(data, status, headers) {
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
