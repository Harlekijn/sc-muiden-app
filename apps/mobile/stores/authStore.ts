import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile, Member } from '@sc-muiden/shared';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  member: Member | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setMember: (member: Member | null) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  member: null,
  initialized: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setMember: (member) => set({ member }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({ session: null, profile: null, member: null }),
}));
