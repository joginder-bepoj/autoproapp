import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'autoproapp',
  webDir: 'www',
  server: {
    allowNavigation: ['https://api.americankeysupply.com', 'https://api.americankeysupply.com/V1/']
  },
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
  },
  overrideUserAgent: "Mozilla/5.0 (Linux; Android 13; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"

};

export default config;
