import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'autoproapp',
  webDir: 'www',

  server: {
    allowNavigation: [
      'https://api.americankeysupply.com',
    ]
  },

  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;