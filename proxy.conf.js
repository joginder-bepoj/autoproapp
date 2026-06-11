const PROXY_CONFIG = {
  "/V1": {
    target: "https://api.americankeysupply.com",
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      "^/V1": "/V1"
    },
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
      );

      proxyReq.setHeader("Accept", "application/json, text/plain, */*");

      proxyReq.setHeader(
        "sec-ch-ua",
        '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"'
      );
      proxyReq.setHeader("sec-ch-ua-mobile", "?0");
      proxyReq.setHeader("sec-ch-ua-platform", '"Windows"');

      proxyReq.setHeader("sec-fetch-dest", "empty");
      proxyReq.setHeader("sec-fetch-mode", "cors");
      proxyReq.setHeader("sec-fetch-site", "same-origin");

      proxyReq.setHeader("Origin", "https://api.americankeysupply.com");
      proxyReq.setHeader("Referer", "https://api.americankeysupply.com/");
      proxyReq.setHeader("Accept-Language", "en-GB,en-US;q=0.9,en;q=0.8");

      proxyReq.setHeader("cache-control", "no-cache");
      proxyReq.setHeader("pragma", "no-cache");

      const userCookies = [
        // your cookies here
      ].join("; ");

      proxyReq.setHeader("Cookie", userCookies);
    }
  },

  "/autoApi": {
    target: "https://autoproapp.com",
    secure: true,
    changeOrigin: true,
    logLevel: "debug"
  }
};

module.exports = PROXY_CONFIG;