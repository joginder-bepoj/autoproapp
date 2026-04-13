import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'autoproapp',
  webDir: 'www',
  overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  server: {
    allowNavigation: ['https://api.americankeysupply.com', 'https://api.americankeysupply.com/V1/']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },

};

export default config;
