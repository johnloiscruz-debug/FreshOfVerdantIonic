import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Fresh_of_Verdant',
  webDir: 'www',
  plugins: {
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
};

export default config;
