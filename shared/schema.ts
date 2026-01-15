import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  player1Id: integer("player1_id").notNull(), // Ideally FK to players, but simplifying for now or can use FK
  player2Id: integer("player2_id").notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"), // draft, in_progress, completed
  teamCount: integer("team_count").notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  round: integer("round").notNull(), // 1 for first round, 2 for second, etc.
  matchOrder: integer("match_order").notNull(), // Position in the round
  team1Id: integer("team1_id"), // Nullable for TBD
  team2Id: integer("team2_id"), // Nullable for TBD
  score1: integer("score1").default(0),
  score2: integer("score2").default(0),
  winnerId: integer("winner_id"),
});

// === RELATIONS ===

export const teamsRelations = relations(teams, ({ one }) => ({
  player1: one(players, {
    fields: [teams.player1Id],
    references: [players.id],
  }),
  player2: one(players, {
    fields: [teams.player2Id],
    references: [players.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  team1: one(teams, {
    fields: [matches.team1Id],
    references: [teams.id],
  }),
  team2: one(teams, {
    fields: [matches.team2Id],
    references: [teams.id],
  }),
  winner: one(teams, {
    fields: [matches.winnerId],
    references: [teams.id],
  }),
}));

// === SCHEMAS ===

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, status: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true });

// === TYPES ===

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Extended types for frontend convenience
export type TeamWithPlayers = Team & {
  player1?: Player;
  player2?: Player;
};

export type MatchWithTeams = Match & {
  team1?: Team;
  team2?: Team;
  winner?: Team;
};

// API Types
export type CreatePlayerRequest = InsertPlayer;
export type CreateTeamRequest = InsertTeam;
export type CreateTournamentRequest = InsertTournament;
export type UpdateMatchRequest = Partial<InsertMatch> & {
  advanceWinner?: boolean; // specialized flag for logic
};
