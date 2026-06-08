import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { queryClient } from './src/api/queryClient';
import Navigation from './src/navigation';
import * as Keychain from 'react-native-keychain';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    // Attempt to restore session on boot
    const restoreSession = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
          const { access, refresh } = JSON.parse(credentials.password);
          await setTokens(access, refresh);
        }
      } catch (error) {
        console.warn('Failed to restore session:', error);
      }
    };
    restoreSession();
  }, [setTokens]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Navigation />
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
