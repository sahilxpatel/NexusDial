import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';

interface AuthState {
  accessToken: string | null;
  tenantId: string | null;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clearTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  tenantId: null,

  setTokens: async (access: string, refresh: string) => {
    // Zero AsyncStorage usage. Persist using Keychain securely.
    await Keychain.setGenericPassword('tokens', JSON.stringify({ access, refresh }));
    
    // Minimal decode to just get tenantId from JWT (not verifying signature on client, just parsing payload)
    let parsedTenantId = null;
    try {
      const payload = access.split('.')[1];
      const decodedStr = atob(payload);
      const decodedJson = JSON.parse(decodedStr);
      parsedTenantId = decodedJson.tenantId;
    } catch (e) {
      console.warn('Could not parse tenantId from token');
    }

    set({ accessToken: access, tenantId: parsedTenantId });
  },

  clearTokens: async () => {
    await Keychain.resetGenericPassword();
    set({ accessToken: null, tenantId: null });
  },
}));
