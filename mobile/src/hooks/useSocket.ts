import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useCallStore } from '../store/callStore';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
// Socket URL needs to remove /api if API_URL has it
const SOCKET_URL = API_URL.replace(/\/api$/, '');

let globalSocket: Socket | null = null;

export const useSocket = () => {
  const { accessToken } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const addActiveCall = useCallStore((state) => state.addActiveCall);
  const updateIntelligence = useCallStore((state) => state.updateIntelligence);

  useEffect(() => {
    if (!accessToken) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setSocket(null);
      }
      return;
    }

    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        transports: ['websocket'],
      });

      globalSocket.on('connect', () => {
        globalSocket?.emit('join', { token: accessToken });
      });

      globalSocket.on('call_event', (data) => {
        addActiveCall(data);
        Toast.show({
          type: 'info',
          text1: 'Incoming Call',
          text2: `From ${data.direction === 'INBOUND' ? 'Contact' : 'Virtual Number'}`,
        });
      });

      globalSocket.on('intelligence_ready', (data) => {
        updateIntelligence(data);
        Toast.show({
          type: 'success',
          text1: 'Intelligence Ready',
          text2: 'Call summary is now available',
        });
      });

      setSocket(globalSocket);
    }

    return () => {
      // Don't disconnect on unmount of hook, let the store token change handle it
    };
  }, [accessToken, addActiveCall, updateIntelligence]);

  return { socket };
};
