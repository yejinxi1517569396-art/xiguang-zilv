// =========================================================
// 汐光自律 · AI 后端代理 (Vercel Serverless Function)
// 路径: /api/ai
// 作用: 在服务端用环境变量里的 OPENAI_API_KEY 转发请求,
//       前端永远不会直接接触 Key, 也避免 CORS 与浏览器跨域限制.
// 部署: 在 Vercel 项目里设置环境变量:
//   - OPENAI_API_KEY  必填
//   - OPENAI_BASE_URL 可选, 默认 https://api.openai.com/v1
//   - OPENAI_MODEL    可选, 默认 gpt-3.5-turbo
// =========================================================

export default async function handler(req, res) {
  // CORS 预检, 允许 GitHub Pages 等前端跨域调用
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: '后端未配置 OPENAI_API_KEY 环境变量, 请在 Vercel 设置中添加'
    });
  }

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const defaultModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    body = body || {};

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      return res.status(400).json({ error: '缺少 messages 字段' });
    }

    const model = body.model || defaultModel;
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;

    // 调用真实 OpenAI 接口
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || 'AI 上游接口返回错误',
        raw: data
      });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text, model, usage: data.usage || null });
  } catch (err) {
    return res.status(500).json({
      error: '后端代理出错: ' + (err && err.message ? err.message : '未知错误')
    });
  }
}
