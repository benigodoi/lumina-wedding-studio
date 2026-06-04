import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luminaweddingstudio.app',
  appName: 'Lumina Wedding Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
