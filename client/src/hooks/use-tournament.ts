// use-tournament.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type {
  CreatePlayerRequest,
  CreateTeamRequest,
  CreateTournamentRequest,
  UpdateMatchRequest,
  TeamWithPlayers,
  MatchWithTeams,
} from "@shared/schema";

// === PLAYERS ===
export function usePlayers() {
  return useQuery({
    queryKey: [api.players.list.path],
    queryFn: async () => {
      const res = await fetch(api.players.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch players");
      return api.players.list.responses[200].parse(await res.json());
    },
  });
}

const DUAMENIT = 2 * 60 * 1000;

export function useTournamentView(id: number) {
  return useQuery({
    queryKey: [api.tournaments.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tournaments.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch tournament");
      return api.tournaments.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
    refetchInterval: DUAMENIT,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

export function useTournamentMatchesView(tournamentId: number) {
  return useQuery({
    queryKey: [api.tournaments.getMatches.path, tournamentId],
    queryFn: async () => {
      const url = buildUrl(api.tournaments.getMatches.path, {
        id: tournamentId,
      });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      return api.tournaments.getMatches.responses[200].parse(
        await res.json()
      ) as MatchWithTeams[];
    },
    enabled: !!tournamentId,

    refetchInterval: DUAMENIT,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePlayerRequest) => {
      const validated = api.players.create.input.parse(data);
      const res = await fetch(api.players.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) throw new Error("Validation failed");
        throw new Error("Failed to create player");
      }
      return api.players.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.players.list.path] });
    },
  });
}

export function useSoftDeletePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.players.softDelete.path, { id }), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to soft delete player");
      return api.players.softDelete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.players.list.path] });
    },
  });
}

// === TEAMS ===
export function useTeams() {
  return useQuery({
    queryKey: [api.teams.list.path],
    queryFn: async () => {
      const res = await fetch(api.teams.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teams");
      return api.teams.list.responses[200].parse(
        await res.json()
      ) as TeamWithPlayers[];
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTeamRequest) => {
      // Coerce player IDs to numbers if they come as strings from forms
      const payload = {
        ...data,
        player1Id: Number(data.player1Id),
        player2Id: Number(data.player2Id),
      };

      const validated = api.teams.create.input.parse(payload);
      const res = await fetch(api.teams.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create team");
      return api.teams.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
    },
  });
}

// === TOURNAMENTS ===
export function useTournaments() {
  return useQuery({
    queryKey: [api.tournaments.list.path],
    queryFn: async () => {
      const res = await fetch(api.tournaments.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      return api.tournaments.list.responses[200].parse(await res.json());
    },
  });
}

export function useTournament(id: number) {
  return useQuery({
    queryKey: [api.tournaments.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tournaments.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch tournament");
      return api.tournaments.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTournamentRequest) => {
      const payload = { ...data, teamCount: Number(data.teamCount) };
      const validated = api.tournaments.create.input.parse(payload);

      const res = await fetch(api.tournaments.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create tournament");
      return api.tournaments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tournaments.list.path] });
    },
  });
}

// === MATCHES ===
export function useTournamentMatches(tournamentId: number) {
  return useQuery({
    queryKey: [api.tournaments.getMatches.path, tournamentId],
    queryFn: async () => {
      const url = buildUrl(api.tournaments.getMatches.path, {
        id: tournamentId,
      });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      return api.tournaments.getMatches.responses[200].parse(
        await res.json()
      ) as MatchWithTeams[];
    },
    enabled: !!tournamentId,
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: UpdateMatchRequest;
    }) => {
      const url = buildUrl(api.matches.update.path, { id });

      // Coerce scores to numbers if needed
      const payload: any = { ...updates };
      if (payload.score1 !== undefined) payload.score1 = Number(payload.score1);
      if (payload.score2 !== undefined) payload.score2 = Number(payload.score2);
      if (payload.team1Id !== undefined)
        payload.team1Id = Number(payload.team1Id);
      if (payload.team2Id !== undefined)
        payload.team2Id = Number(payload.team2Id);

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update match");
      return api.matches.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      // We invalidate matches for the tournament (need tournament ID, but we usually refetch all matches)
      queryClient.invalidateQueries({
        queryKey: [api.tournaments.getMatches.path],
      });
    },
  });
}
