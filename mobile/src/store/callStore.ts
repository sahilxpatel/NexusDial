import { create } from 'zustand';

interface CallStore {
  activeCalls: any[];
  addActiveCall: (call: any) => void;
  updateIntelligence: (call: any) => void;
}

export const useCallStore = create<CallStore>((set) => ({
  activeCalls: [],
  addActiveCall: (call) => set((state) => {
    const exists = state.activeCalls.find((c) => c.id === call.id);
    if (exists) return state;
    return { activeCalls: [call, ...state.activeCalls] };
  }),
  updateIntelligence: (call) => set((state) => ({
    activeCalls: state.activeCalls.map(c => c.id === call.id ? call : c)
  })),
}));
