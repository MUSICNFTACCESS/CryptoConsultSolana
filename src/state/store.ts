import { create } from 'zustand';

type AppState = {
  walletConnected: boolean;
  hasPaid: boolean;
  freeQuestionsRemaining: number;
  setWalletConnected: (connected: boolean) => void;
  setHasPaid: (paid: boolean) => void;
  decrementFreeQuestions: () => void;
};

export const useAppState = create<AppState>((set) => ({
  walletConnected: false,
  hasPaid: false,
  freeQuestionsRemaining: 3,
  setWalletConnected: (connected) => set({ walletConnected: connected }),
  setHasPaid: (paid) => set({ hasPaid: paid }),
  decrementFreeQuestions: () =>
    set((state) => ({
      freeQuestionsRemaining: Math.max(0, state.freeQuestionsRemaining - 1),
    })),
}));
