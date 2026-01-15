// server/routes.ts
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === Players ===
  app.get(api.players.list.path, async (req, res) => {
    const players = await storage.getPlayers();
    res.json(players);
  });

  app.post(api.players.create.path, async (req, res) => {
    try {
      const input = api.players.create.input.parse(req.body);
      const player = await storage.createPlayer(input);
      res.status(201).json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.players.softDelete.path, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id, 10);
      const player = await storage.softDeletePlayer(playerId);
      res.status(200).json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Teams ===
  app.get(api.teams.list.path, async (req, res) => {
    const teams = await storage.getTeams();
    res.json(teams);
  });

  app.post(api.teams.create.path, async (req, res) => {
    try {
      const input = api.teams.create.input.parse(req.body);
      if (input.player1Id === input.player2Id) {
        return res.status(400).json({ message: "Players must be different" });
      }

      const p1Used = await storage.isPlayerUsedInAnyTeam(input.player1Id);
      if (p1Used)
        return res
          .status(400)
          .json({ message: "Player 1 already used in another team" });

      const p2Used = await storage.isPlayerUsedInAnyTeam(input.player2Id);
      if (p2Used)
        return res
          .status(400)
          .json({ message: "Player 2 already used in another team" });

      const team = await storage.createTeam(input);
      res.status(201).json(team);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.teams.softDelete.path, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id, 10);
      const team = await storage.softDeleteTeam(teamId);
      res.status(200).json(team);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Tournaments ===
  app.get(api.tournaments.list.path, async (req, res) => {
    const tournaments = await storage.getTournaments();
    res.json(tournaments);
  });

  app.post(api.tournaments.create.path, async (req, res) => {
    try {
      const input = api.tournaments.create.input.parse(req.body);
      const tournament = await storage.createTournament({
        ...input,
        status: input.status ?? "in_progress", // atau "draft"
      });

      // Generate initial bracket structure (matches)
      // For a simplified bracket, we generate empty matches for the tree
      // Binary tree structure: N teams -> N-1 matches
      // Round 1: N/2 matches. Round 2: N/4 matches...

      const teamCount = input.teamCount;
      let matchIdCounter = 1;
      let round = 1;
      let matchCountInRound = teamCount / 2;

      while (matchCountInRound >= 1) {
        for (let i = 0; i < matchCountInRound; i++) {
          await storage.createMatch({
            tournamentId: tournament.id,
            round: round,
            matchOrder: i,
            team1Id: null,
            team2Id: null,
            score1: 0,
            score2: 0,
            winnerId: null,
          });
        }
        matchCountInRound /= 2;
        round++;
      }

      res.status(201).json(tournament);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.tournaments.get.path, async (req, res) => {
    const tournament = await storage.getTournament(Number(req.params.id));
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    res.json(tournament);
  });

  app.get(api.tournaments.getMatches.path, async (req, res) => {
    const matches = await storage.getMatchesByTournament(Number(req.params.id));
    res.json(matches);
  });

  // === Matches ===
  app.patch(api.matches.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.matches.update.input.parse(req.body);

      const currentMatch = await storage.getMatch(id);
      if (!currentMatch)
        return res.status(404).json({ message: "Match not found" });

      // Pisahkan flag advanceWinner dari updates yang masuk DB
      const { advanceWinner, ...updates } = input as any;

      // Kalau frontend kirim score sebagai string, pastikan number (defensive)
      if (updates.score1 !== undefined) updates.score1 = Number(updates.score1);
      if (updates.score2 !== undefined) updates.score2 = Number(updates.score2);

      // Kalau advanceWinner = true dan dua tim sudah ada, tentukan pemenang
      if (advanceWinner) {
        const team1Id = updates.team1Id ?? currentMatch.team1Id;
        const team2Id = updates.team2Id ?? currentMatch.team2Id;

        const score1 = updates.score1 ?? currentMatch.score1 ?? 0;
        const score2 = updates.score2 ?? currentMatch.score2 ?? 0;

        // Wajib ada dua team untuk menentukan winner
        if (team1Id && team2Id) {
          if (score1 > score2) updates.winnerId = team1Id;
          else if (score2 > score1) updates.winnerId = team2Id;
          else updates.winnerId = null; // seri -> belum ada pemenang (atau bikin rule tie-break)
        }
      }

      // Update match (winnerId ikut ke-save kalau ada)
      const updatedMatch = await storage.updateMatch(id, updates);
      // after updatedMatch saved
      const tourney = await storage.getTournament(updatedMatch.tournamentId);
      if (tourney) {
        // 1) kalau tournament masih draft dan ada aktivitas match, jadikan in_progress
        const hasActivity =
          (updatedMatch.team1Id && updatedMatch.team2Id) ||
          (updatedMatch.score1 ?? 0) > 0 ||
          (updatedMatch.score2 ?? 0) > 0 ||
          !!updatedMatch.winnerId;

        if (tourney.status === "draft" && hasActivity) {
          await storage.updateTournamentStatus(tourney.id, "in_progress");
        }

        // 2) kalau final match sudah ada winner, completed
        const allMatches = await storage.getMatchesByTournament(
          updatedMatch.tournamentId
        );
        const maxRound = Math.max(...allMatches.map((m) => m.round));
        const finalMatch = allMatches.find(
          (m) => m.round === maxRound && m.matchOrder === 0
        );

        if (finalMatch?.winnerId) {
          await storage.updateTournamentStatus(tourney.id, "completed");
        }
      }

      // Advance winner ke match berikutnya kalau winnerId sudah ada
      if (updatedMatch.winnerId) {
        const allMatches = await storage.getMatchesByTournament(
          updatedMatch.tournamentId
        );

        const nextRound = updatedMatch.round + 1;
        const nextOrder = Math.floor(updatedMatch.matchOrder / 2);

        const nextMatch = allMatches.find(
          (m) => m.round === nextRound && m.matchOrder === nextOrder
        );

        if (nextMatch) {
          const isTeam1Slot = updatedMatch.matchOrder % 2 === 0;
          const advanceUpdates: any = isTeam1Slot
            ? { team1Id: updatedMatch.winnerId }
            : { team2Id: updatedMatch.winnerId };

          await storage.updateMatch(nextMatch.id, advanceUpdates);
        }
      }

      res.json(updatedMatch);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Seed data
  await seed();

  return httpServer;
}

async function seed() {
  const players = await storage.getPlayers();
  if (players.length === 0) {
    const p1 = await storage.createPlayer({ name: "Alex" });
    const p2 = await storage.createPlayer({ name: "Sam" });
    const p3 = await storage.createPlayer({ name: "Jordan" });
    const p4 = await storage.createPlayer({ name: "Taylor" });
    const p5 = await storage.createPlayer({ name: "Casey" });
    const p6 = await storage.createPlayer({ name: "Riley" });
    const p7 = await storage.createPlayer({ name: "Morgan" });
    const p8 = await storage.createPlayer({ name: "Quinn" });

    await storage.createTeam({
      name: "The Alphas",
      player1Id: p1.id,
      player2Id: p2.id,
    });
    await storage.createTeam({
      name: "Beta Blasters",
      player1Id: p3.id,
      player2Id: p4.id,
    });
    await storage.createTeam({
      name: "Gamma Rays",
      player1Id: p5.id,
      player2Id: p6.id,
    });
    await storage.createTeam({
      name: "Delta Force",
      player1Id: p7.id,
      player2Id: p8.id,
    });
  }
}
