import { create } from "zustand";

export type FarmerData = {
  wallet: string;
  recipientAddress: string;
  landProofHash: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  cropType: number;
  registered: boolean;
  registrationTxHash?: string;
};

type WorkflowStore = {
  farmers: FarmerData[];
  currentFarmer: FarmerData | null;
  schemeNonce: number;
  addFarmer: (farmer: FarmerData) => void;
  updateFarmer: (updates: Partial<FarmerData>) => void;
  setCurrentFarmer: (farmer: FarmerData | null) => void;
  incrementSchemeNonce: () => number;
  reset: () => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  farmers: [],
  currentFarmer: null,
  schemeNonce: 0,
  addFarmer: (farmer) =>
    set((state) => ({
      farmers: [...state.farmers, farmer],
      currentFarmer: farmer,
    })),
  updateFarmer: (updates) =>
    set((state) => {
      if (!state.currentFarmer) return state;
      
      // Check if update is actually needed
      const hasChanges = Object.keys(updates).some(
        (key) => state.currentFarmer![key as keyof FarmerData] !== updates[key as keyof FarmerData]
      );
      
      if (!hasChanges) return state; // No changes, skip update
      
      const updated = { ...state.currentFarmer, ...updates };
      return {
        currentFarmer: updated,
        farmers: state.farmers.map((f) => (f.wallet === updated.wallet ? updated : f)),
      };
    }),
  setCurrentFarmer: (farmer) => set({ currentFarmer: farmer }),
  incrementSchemeNonce: () => {
    let newNonce: number;
    set((state) => {
      newNonce = state.schemeNonce + 1;
      return { schemeNonce: newNonce };
    });
    return newNonce!;
  },
  reset: () =>
    set({
      farmers: [],
      currentFarmer: null,
      schemeNonce: 0,
    }),
}));

