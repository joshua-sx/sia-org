import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Organization {
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


interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  organization: null,
  loading: true,
  signOut: async () => {},
  refreshOrganization: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const ORG_COLUMNS =
  "id, name, country, industry, setup_complete, structure_complete, people_complete, cycle_complete, structure_skipped, people_skipped, cycle_skipped";

/** Decode a JWT payload and return true if it contains an organization_id claim. */
function jwtHasOrgClaim(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return !!payload?.organization_id;
  } catch {
    return false;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  // Guard against infinite refresh loops when the JWT hook is disabled at the platform level.
  const refreshedForUserRef = useRef<string | null>(null);

  const fetchProfileAndOrg = async (userId: string): Promise<Profile | null> => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileData) {
      setProfile(profileData);
      const { data: orgData } = await supabase
        .from("organizations")
        .select(ORG_COLUMNS)
        .eq("id", profileData.organization_id)
        .single();
      if (orgData) setOrganization(orgData as Organization);
      return profileData as Profile;
    }
    return null;
  };

  const refreshOrganization = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("organizations")
      .select(ORG_COLUMNS)
      .eq("id", profile.organization_id)
      .single();
    if (data) setOrganization(data as Organization);
  }, [profile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(async () => {
            const p = await fetchProfileAndOrg(session.user.id);
            // If the user has a profile but the current JWT lacks the
            // organization_id claim (stale session issued before the profile
            // existed, or right after signup), force one session refresh so
            // subsequent RLS-protected inserts don't fail with 42501.
            if (
              p?.organization_id &&
              refreshedForUserRef.current !== session.user.id &&
              !jwtHasOrgClaim(session.access_token)
            ) {
              refreshedForUserRef.current = session.user.id;
              await supabase.auth.refreshSession();
            }
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          refreshedForUserRef.current = null;
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const p = await fetchProfileAndOrg(session.user.id);
        if (
          p?.organization_id &&
          refreshedForUserRef.current !== session.user.id &&
          !jwtHasOrgClaim(session.access_token)
        ) {
          refreshedForUserRef.current = session.user.id;
          await supabase.auth.refreshSession();
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setOrganization(null);
    refreshedForUserRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        organization,
        loading,
        signOut,
        refreshOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
