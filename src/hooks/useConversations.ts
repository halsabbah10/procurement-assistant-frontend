import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteConversation, fetchConversations, renameConversation } from "../lib/api";

const QUERY_KEY = ["conversations"];

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchConversations,
    refetchInterval: 30_000,
  });

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameConversation(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    rename: rename.mutateAsync,
    remove: remove.mutateAsync,
    refresh,
  };
}
