import { useQuery } from "@tanstack/react-query";

export function useEntitySelect(endpoint: string) {
  return useQuery({
    queryKey: ["select", endpoint],
    queryFn: async () => {
      const r = await fetch(endpoint);
      const j = await r.json();
      return (j.data?.items ?? []) as { id: string; label: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
