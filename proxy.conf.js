const PROXY_CONFIG = {
  "/V1": {
    "target": "https://api.americankeysupply.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/V1": "/V1"
    },
    "logLevel": "debug",
    "onProxyReq": (proxyReq, req, res) => {
      // Mimic a real browser session completely to bypass Cloudflare
      // Headers synced from your browser's absolute latest request fingerprint
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36');
      proxyReq.setHeader('Accept', 'application/json, text/plain, */*');

      // Modern browser security and Client Hints headers
      proxyReq.setHeader('sec-ch-ua', '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"');
      proxyReq.setHeader('sec-ch-ua-mobile', '?0');
      proxyReq.setHeader('sec-ch-ua-platform', '"Windows"');
      proxyReq.setHeader('sec-fetch-dest', 'empty');
      proxyReq.setHeader('sec-fetch-mode', 'cors');
      proxyReq.setHeader('sec-fetch-site', 'same-origin');

      // Navigation and language headers
      proxyReq.setHeader('Origin', 'https://api.americankeysupply.com');
      proxyReq.setHeader('Referer', 'https://api.americankeysupply.com/');
      proxyReq.setHeader('Accept-Language', 'en-GB,en-US;q=0.9,en;q=0.8');
      proxyReq.setHeader('cache-control', 'no-cache');
      proxyReq.setHeader('pragma', 'no-cache');

      // Inject essential session and Cloudflare cookies provided in your browser logs
      // Note: If 403 Forbidden persists, please refresh the 'cf_clearance' cookie from your browser tools.
      const userCookies = [
        'cf_clearance=YxIpfctrBdXe80vp_E30qJdS02GGLKMt98Khb7GhEA8-1775457601-1.2.1.1-Gs98cbw3EDPm9YKcIRwsKo89q1eogCs1gZEA23n.JqlJNILWQNieuT.EgEZuE048RYKa8_OnaGiAfXWqOIFvpSczIi.aOQO1uKxvX9oDy5J8JceFK5vddq0_j7_3MP5j78xCiYDtV1uIeEjC8Zjpf1Ng7r2vbsgQ4YFtBjdqkaCjJgI16g5Fz59eL2E7fLeXVrkTaREYk3TqGmDQ6SRXT.7ogC1pwLfIrMWqe_YSbOyEta.MG9hg9p942.2w.8Ud6.DBWZi9xmUAcqA4VJIQF61zb95JMlk_zyLl2LUzT_OlS5ukWrVAXsVq_ljbnN2OAmOPHTO6i66Ps6unL4p6lA',
        '_ga=GA1.1.1601079453.1767932870',
        'ezdfasgefdevsdfggdgsf=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoieWlkZWxicmF2ZXJAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiI0MSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InlpZGVsYnJhdmVyQGdtYWlsLmNvbSIsImV4cCI6MTc3Mzg1MjA5NywiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIn0.xHS4XhrJpgzEzZ2k6z4h68musuPZ3jCt2QKMEUz6MiQ',
        '_ga_MJDCJZTP2T=GS2.1.s1773807963$o38$g1$t1773809212$j60$l0$h0',
        '_clck=foe802%5E2%5Eg4u%5E0%5E2199'
      ].join('; ');

      proxyReq.setHeader('Cookie', userCookies);
    }
  }
};

module.exports = PROXY_CONFIG;
