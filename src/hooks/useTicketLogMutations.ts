import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logService } from "@/services/log.service";

export const useTicketLogMutations = () => {
  const queryClient = useQueryClient();

  const deleteLog = useMutation({
    mutationFn: (logId: string) => logService.deleteLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-logs"] });
    },
  });

  return {
    deleteLog,
  };
}; 