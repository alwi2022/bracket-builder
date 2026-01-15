// server/storage.ts
import { db } from "./db";
import {
  players, teams, tournaments, matches,
  type InsertPlayer, type InsertTeam, type InsertTournament, type InsertMatch, type UpdateMatchRequest,
  type Player, type Team, type Tournament, type Match, type MatchWithTeams
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  // Players
  getPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;

  // Teams
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;

  // Tournaments
  getTournaments(): Promise<Tournament[]>;
  getTournament(id: number): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;

  // Matches
  getMatchesByTournament(tournamentId: number): Promise<MatchWithTeams[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: number): Promise<Match | undefined>;
  updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match>;
}

export class DatabaseStorage implements IStorage {
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async getTeams(): Promise<Team[]> {
    return await db.query.teams.findMany({
      with: {
        player1: true,
        player2: true
      }
    });
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return await db.query.teams.findFirst({
      where: eq(teams.id, id),
      with: {
        player1: true,
        player2: true
      }
    });
  }

  async getTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(asc(tournaments.id));
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament;
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const [newTournament] = await db.insert(tournaments).values(tournament).returning();
    return newTournament;
  }

  async getMatchesByTournament(tournamentId: number): Promise<MatchWithTeams[]> {
    return await db.query.matches.findMany({
      where: eq(matches.tournamentId, tournamentId),
      orderBy: asc(matches.matchOrder),
      with: {
        team1: true,
        team2: true,
        winner: true
      }
    });
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match> {
    const [updated] = await db.update(matches)
      .set(updates)
      .where(eq(matches.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
