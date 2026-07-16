import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Typed shim for the beta supabase.auth.oauth namespace.
interface OAuthClient {
  name?: string;
}

interface OAuthAuthorizationDetails {
  client?: OAuthClient;
  redirect_url?: string;
  redirect_to?: string;
}

interface OAuthErrorInfo {
  message: string;
}

type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: OAuthAuthorizationDetails | null; error: OAuthErrorInfo | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthAuthorizationDetails | null; error: OAuthErrorInfo | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthAuthorizationDetails | null; error: OAuthErrorInfo | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-[Space_Grotesk]">Authorize access</CardTitle>
          <CardDescription>
            {details?.client?.name
              ? `Connect ${details.client.name} to your SIA account`
              : "Review this connection request"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && !details && <p className="text-sm text-muted-foreground">Loading…</p>}
          {details && (
            <>
              <p className="text-sm text-muted-foreground">
                This will let{" "}
                <span className="font-medium text-foreground">
                  {details.client?.name ?? "the client"}
                </span>{" "}
                access SIA on your behalf. It will only see data your account can see.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => decide(false)}
                  className="flex-1"
                >
                  Deny
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => decide(true)}
                  className="flex-1"
                >
                  {busy ? "Working…" : "Approve"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
