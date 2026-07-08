import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";

/**
 * The employee record linked to the signed-in user via employees.profile_id.
 * Most imported employees have no profile yet (invitations are out of scope),
 * so callers must handle the null case with an empty state.
 */
export function useMyEmployee() {
  const { user } = useAuth();
  const { data: employees = [], isLoading, isError, error, refetch } = useEmployees();
  const myEmployee = user ? employees.find((e) => e.profile_id === user.id) ?? null : null;
  return { myEmployee, isLoading, isError, error, refetch };
}
