const config = {
  appId: process.env.VITE_APP_PACKAGE_ID || 'com.kingdomludo.app',
  appName: process.env.VITE_APP_NAME || 'KingdomLudo',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#10141E',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#10141E',
    },
  },
};

export default config;
