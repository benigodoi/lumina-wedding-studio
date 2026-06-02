import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luminaweddingstudio.app',
  appName: 'Lumina Wedding Studio',
  webDir: 'dist',
  // When running on a real device/emulator, all fetch calls need an absolute URL.
  // Set VITE_API_BASE_URL at build time to point to your hosted Express server.
  // e.g. https://your-server.com
  server: {
    // Allow loading content from the hosted server URL during development
    // androidScheme: 'https',
  },
};

export default config;
