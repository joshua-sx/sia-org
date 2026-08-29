import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  AuthContext,
  type Organization,
  type Profile,
} from "./AuthContext";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const refreshedForUserRef = useRef<string | null>(null);

  const fetchProfileAndOrg = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileFetchError) {
      setProfile(null);
      setOrganization(null);
      setProfileError(profileFetchError.message);
      return null;
    }

    if (!profileData) {
      setProfile(null);
      setOrganization(null);
      setProfileError(null);
      return null;
    }

    setProfile(profileData);
    const { data: orgData, error: orgFetchError } = await supabase
      .from("organizations")
      .select(ORG_COLUMNS)
      .eq("id", profileData.organization_id)
      .single();

    if (orgFetchError) {
      setOrganization(null);
      setProfileError(orgFetchError.message);
      return profileData as Profile;
    }

    if (orgData) setOrganization(orgData as Organization);
    setProfileError(null);
    return profileData as Profile;
  }, []);

  const refreshOrganization = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("organizations")
      .select(ORG_COLUMNS)
      .eq("id", profile.organization_id)
      .single();
    if (error) {
      setProfileError(error.message);
      return;
    }
    if (data) {
      setOrganization(data as Organization);
      setProfileError(null);
    }
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    await fetchProfileAndOrg(session.user.id);
    setLoading(false);
  }, [fetchProfileAndOrg, session?.user]);

  useEffect(() => {
    const loadForSession = async (session: Session | null) => {
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
      } else {
        setProfile(null);
        setOrganization(null);
        setProfileError(null);
        refreshedForUserRef.current = null;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        loadForSession(session).finally(() => setLoading(false));
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await loadForSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndOrg]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setOrganization(null);
    setProfileError(null);
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
        profileError,
        signOut,
        refreshOrganization,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
