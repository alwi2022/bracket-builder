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

  // === Teams ===
  app.get(api.teams.list.path, async (req, res) => {
    const teams = await storage.getTeams();
    res.json(teams);
  });

  app.post(api.teams.create.path, async (req, res) => {
    try {
      const input = api.teams.create.input.parse(req.body);
      const team = await storage.createTeam(input);
      res.status(201).json(team);
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
      const tournament = await storage.createTournament(input);
      
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
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
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
      
      // Get current match state
      const currentMatch = await storage.getMatch(id);
      if (!currentMatch) return res.status(404).json({ message: "Match not found" });
      
      // Update the match
      const updatedMatch = await storage.updateMatch(id, input);

      // If we need to advance the winner
      // Logic: If there is a winner, find the next match in the tree and place them
      if (updatedMatch.winnerId) {
        const matches = await storage.getMatchesByTournament(updatedMatch.tournamentId);
        
        // Find next match
        // Current match is at 'round' and 'matchOrder'
        // Next match is at 'round + 1', and order is floor(matchOrder / 2)
        // Position in next match is: matchOrder % 2 === 0 ? team1 : team2
        
        const nextRound = updatedMatch.round + 1;
        const nextOrder = Math.floor(updatedMatch.matchOrder / 2);
        
        const nextMatch = matches.find(m => m.round === nextRound && m.matchOrder === nextOrder);
        
        if (nextMatch) {
          const isTeam1Slot = updatedMatch.matchOrder % 2 === 0;
          const updates: any = {};
          if (isTeam1Slot) {
            updates.team1Id = updatedMatch.winnerId;
          } else {
            updates.team2Id = updatedMatch.winnerId;
          }
          await storage.updateMatch(nextMatch.id, updates);
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

    await storage.createTeam({ name: "The Alphas", player1Id: p1.id, player2Id: p2.id });
    await storage.createTeam({ name: "Beta Blasters", player1Id: p3.id, player2Id: p4.id });
    await storage.createTeam({ name: "Gamma Rays", player1Id: p5.id, player2Id: p6.id });
    await storage.createTeam({ name: "Delta Force", player1Id: p7.id, player2Id: p8.id });
  }
}
