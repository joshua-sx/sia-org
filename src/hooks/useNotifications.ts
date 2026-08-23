import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Notifications are written only by the send_cycle_nudge RPC (SECURITY
 * DEFINER). The client can read its own rows and flip read_at — a guard
 * trigger rejects any other column change and blocks deletes outright, so a
 * recipient can never rewrite or erase a reminder they were sent.
 */
export interface AppNotification {
  id: string;
  organization_id: string;
  recipient_profile_id: string;
  cycle_id: string | null;
  participant_id: string | null;
  kind: string;
  task_kind: string | null;
  title: string;
  body: string | null;
  link: string | null;
  sender_profile_id: string | null;
  sender_name: string | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const profileId = profile?.id;

  const query = useQuery({
    queryKey: ["notifications", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_profile_id", profileId as string)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AppNotification[];
    },
    enabled: !!profileId,
  });

  // Reminders are only useful if they show up without a refresh.
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_profile_id=eq.${profileId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notifications", profileId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", profileId] });
    },
  });

  const notifications = query.data ?? [];
  const unread = notifications.filter((n) => !n.read_at);

  return {
    notifications,
    unread,
    unreadCount: unread.length,
    isLoading: query.isLoading,
    markRead: markRead.mutate,
    markAllRead: () => markRead.mutate(unread.map((n) => n.id)),
  };
}
