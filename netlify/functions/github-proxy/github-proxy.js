const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'GitHub token not configured' }) };
    }

    const { owner, repo, branch, path, message, content, action, sha, category } = JSON.parse(event.body || '{}');

    if (!owner || !repo || !branch) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required parameters: owner, repo, branch' }) };
    }

    const apiBase = `https://api.github.com`;

    if (action === 'get') {
      const filePath = path || '';
      const url = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
      const result = await githubRequest('GET', url, GITHUB_TOKEN);
      if (result.type === 'file') {
        const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
        return { statusCode: 200, headers, body: JSON.stringify({ ...result, decodedContent: decoded }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (action === 'list') {
      const dirPath = path || '';
      const url = `${apiBase}/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;
      const result = await githubRequest('GET', url, GITHUB_TOKEN);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (action === 'write') {
      if (!path || !message || !content) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required: path, message, content' }) };
      }

      const encodedContent = Buffer.from(content).toString('base64');

      let existingSha = null;
      try {
        const checkUrl = `${apiBase}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const existing = await githubRequest('GET', checkUrl, GITHUB_TOKEN);
        existingSha = existing.sha;
      } catch (e) {}

      const body = {
        message,
        content: encodedContent,
        branch
      };
      if (existingSha) body.sha = existingSha;

      const url = `${apiBase}/repos/${owner}/${repo}/contents/${path}`;
      const result = await githubRequest('PUT', url, GITHUB_TOKEN, body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (action === 'write-batch') {
      const { files } = JSON.parse(event.body || '{}');
      if (!Array.isArray(files) || files.length === 0 || !message) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required: files, message' }) };
      }

      const results = [];
      for (const file of files) {
        if (!file.path || typeof file.content !== 'string') {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Each file requires path and content' }) };
        }

        let existingSha = null;
        try {
          const checkUrl = `${apiBase}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`;
          const existing = await githubRequest('GET', checkUrl, GITHUB_TOKEN);
          existingSha = existing.sha;
        } catch (e) {}

        const body = {
          message: file.message || message,
          content: file.encoding === 'base64' ? file.content : Buffer.from(file.content).toString('base64'),
          branch
        };
        if (existingSha) body.sha = existingSha;

        const url = `${apiBase}/repos/${owner}/${repo}/contents/${file.path}`;
        const result = await githubRequest('PUT', url, GITHUB_TOKEN, body);
        results.push({ path: file.path, result });
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, results }) };
    }

    if (action === 'upload-image') {
      if (!path || !content || !message) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required: path, content (base64), message' }) };
      }

      let existingSha = null;
      try {
        const checkUrl = `${apiBase}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const existing = await githubRequest('GET', checkUrl, GITHUB_TOKEN);
        existingSha = existing.sha;
      } catch (e) {}

      const body = {
        message,
        content,
        branch
      };
      if (existingSha) body.sha = existingSha;

      const url = `${apiBase}/repos/${owner}/${repo}/contents/${path}`;
      const result = await githubRequest('PUT', url, GITHUB_TOKEN, body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (action === 'delete') {
      if (!path || !message) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required: path, message' }) };
      }

      const checkUrl = `${apiBase}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const existing = await githubRequest('GET', checkUrl, GITHUB_TOKEN);

      const body = {
        message,
        sha: existing.sha,
        branch
      };

      const url = `${apiBase}/repos/${owner}/${repo}/contents/${path}`;
      const result = await githubRequest('DELETE', url, GITHUB_TOKEN, body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (action === 'create-post') {
      if (!category || !path || !message || !content) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
      }

      const filePath = `blog2/${category}/${path}`;
      const encoded = Buffer.from(content).toString('base64');

      let existingSha = null;
      try {
        const checkUrl = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
        const existing = await githubRequest('GET', checkUrl, GITHUB_TOKEN);
        existingSha = existing.sha;
      } catch (e) {}

      const body = { message, content: encoded, branch };
      if (existingSha) body.sha = existingSha;

      const url = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}`;
      const result = await githubRequest('PUT', url, GITHUB_TOKEN, body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function githubRequest(method, url, token, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'toolrar-blog-admin',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || `GitHub API error: ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}
