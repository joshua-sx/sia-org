import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  country: string | null;
  industry: string | null;
  setup_complete: boolean | null;
  structure_complete: boolean | null;
  people_complete: boolean | null;
  cycle_complete: boolean | null;
  structure_skipped: boolean | null;
  people_skipped: boolean | null;
  cycle_skipped: boolean | null;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  organization: null,
  loading: true,
  signOut: async () => {},
  refreshOrganization: async () => {},
});

export const useAuth = () => useContext(AuthContext);
