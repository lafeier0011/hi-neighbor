export default {
  async fetch(request) {
    // 处理 CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    const targetUrl = `http://150.158.141.184${url.pathname}${url.search}`

    const headers = new Headers()
    const contentType = request.headers.get('Content-Type')
    if (contentType) headers.set('Content-Type', contentType)
    const auth = request.headers.get('Authorization')
    if (auth) headers.set('Authorization', auth)
    headers.set('Host', '150.158.141.184')

    const init = {
      method: request.method,
      headers,
      redirect: 'manual',
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) init.body = body
      } catch {}
    }

    try {
      const response = await fetch(targetUrl, init)

      const newHeaders = new Headers(response.headers)
      newHeaders.set('Access-Control-Allow-Origin', '*')
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  },
}
