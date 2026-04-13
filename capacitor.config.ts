import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'autoproapp',
  webDir: 'www',
  server: {
    allowNavigation: ['https://api.americankeysupply.com', 'https://api.americankeysupply.com/V1/'],
    url: 'https://api.americankeysupply.com',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },

};

export default config;
