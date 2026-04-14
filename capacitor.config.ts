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
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#0085be",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;