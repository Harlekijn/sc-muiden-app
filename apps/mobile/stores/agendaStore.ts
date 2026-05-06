import { create } from 'zustand';

interface AgendaState {
  selectedDate: Date;
  familyFilter: string | 'all';
  setSelectedDate: (date: Date) => void;
  setFamilyFilter: (filter: string | 'all') => void;
}

export const useAgendaStore = create<AgendaState>((set) => ({
  selectedDate: new Date(),
  familyFilter: 'all',
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFamilyFilter: (filter) => set({ familyFilter: filter }),
}));
