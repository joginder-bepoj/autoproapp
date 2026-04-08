export default async function handler(req, res) {
  // Extract the path from the query parameter
  const path = req.query.path || '';
  
  // Reconstruct any query parameters that were passed to the proxy
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      searchParams.append(key, value);
    }
  }
  const queryString = searchParams.toString();
  
  // Build the target URL
  const targetUrl = `https://api.americankeysupply.com/V1/${path}${queryString ? '?' + queryString : ''}`;

  try {
    const userCookies = [
      'cf_clearance=YxIpfctrBdXe80vp_E30qJdS02GGLKMt98Khb7GhEA8-1775457601-1.2.1.1-Gs98cbw3EDPm9YKcIRwsKo89q1eogCs1gZEA23n.JqlJNILWQNieuT.EgEZuE048RYKa8_OnaGiAfXWqOIFvpSczIi.aOQO1uKxvX9oDy5J8JceFK5vddq0_j7_3MP5j78xCiYDtV1uIeEjC8Zjpf1Ng7r2vbsgQ4YFtBjdqkaCjJgI16g5Fz59eL2E7fLeXVrkTaREYk3TqGmDQ6SRXT.7ogC1pwLfIrMWqe_YSbOyEta.MG9hg9p942.2w.8Ud6.DBWZi9xmUAcqA4VJIQF61zb95JMlk_zyLl2LUzT_OlS5ukWrVAXsVq_ljbnN2OAmOPHTO6i66Ps6unL4p6lA',
      '_ga=GA1.1.1601079453.1767932870',
      'ezdfasgefdevsdfggdgsf=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoieWlkZWxicmF2ZXJAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiI0MSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InlpZGVsYnJhdmVyQGdtYWlsLmNvbSIsImV4cCI6MTc3Mzg1MjA5NywiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIn0.xHS4XhrJpgzEzZ2k6z4h68musuPZ3jCt2QKMEUz6MiQ',
      '_ga_MJDCJZTP2T=GS2.1.s1773807963$o38$g1$t1773809212$j60$l0$h0',
      '_clck=foe802%5E2%5Eg4u%5E0%5E2199'
    ].join('; ');

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'Origin': 'https://api.americankeysupply.com',
      'Referer': 'https://api.americankeysupply.com/',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'Cookie': userCookies
    };

    // Copy Content-Type from original request
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    const options = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Vercel parses application/json automatically
      if (typeof req.body === 'object') {
        options.body = JSON.stringify(req.body);
      } else {
        options.body = req.body;
      }
    }

    const proxyRes = await fetch(targetUrl, options);
    
    // Copy response headers
    for (const [name, value] of proxyRes.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    }

    const data = await proxyRes.arrayBuffer();
    
    res.status(proxyRes.status).send(Buffer.from(data));

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
