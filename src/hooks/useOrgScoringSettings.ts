import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toOrgScoringDbPayload, type OrgScoringFormValues } from "@/lib/orgScoringSchema";

export interface OrgScoringSettings {
  interim_weight_pct: number;
  final_weight_pct: number;
}

/** Org-wide interim/final assessment weight split, read by submit_assessment_stage at final submit. */
export function useOrgScoringSettings() {
  const { organization } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["organizations", organization?.id, "scoring_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("interim_weight_pct, final_weight_pct")
        .eq("id", organization!.id)
        .single();
      if (error) throw error;
      return data as OrgScoringSettings;
    },
    enabled: !!organization,
  });

  const updateWeights = useMutation({
    mutationFn: async (values: OrgScoringFormValues) => {
      const { data, error } = await supabase
        .from("organizations")
        .update(toOrgScoringDbPayload(values))
        .eq("id", organization!.id)
        .select("interim_weight_pct, final_weight_pct")
        .single();
      if (error) throw error;
      return data as OrgScoringSettings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations", organization?.id, "scoring_settings"] }),
  });

  return { ...query, updateWeights };
}
