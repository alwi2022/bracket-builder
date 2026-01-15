import { z } from "zod";
import {
  insertPlayerSchema,
  insertTeamSchema,
  insertTournamentSchema,
  insertMatchSchema,
  players,
  teams,
  tournaments,
  matches,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  players: {
    list: {
      method: "GET" as const,
      path: "/api/players",
      responses: {
        200: z.array(z.custom<typeof players.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/players",
      input: insertPlayerSchema,
      responses: {
        201: z.custom<typeof players.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    softDelete: {
      method: "DELETE" as const,
      path: "/api/players/:id",
      responses: {
        200: z.custom<typeof players.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  teams: {
    list: {
      method: "GET" as const,
      path: "/api/teams",
      responses: {
        200: z.array(
          z.custom<
            typeof teams.$inferSelect & { player1?: any; player2?: any }
          >()
        ),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/teams",
      input: insertTeamSchema,
      responses: {
        201: z.custom<typeof teams.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  tournaments: {
    list: {
      method: "GET" as const,
      path: "/api/tournaments",
      responses: {
        200: z.array(z.custom<typeof tournaments.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/tournaments",
      input: insertTournamentSchema,
      responses: {
        201: z.custom<typeof tournaments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/tournaments/:id",
      responses: {
        200: z.custom<typeof tournaments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    getMatches: {
      method: "GET" as const,
      path: "/api/tournaments/:id/matches",
      responses: {
        200: z.array(
          z.custom<
            typeof matches.$inferSelect & {
              team1?: any;
              team2?: any;
              winner?: any;
            }
          >()
        ),
      },
    },
  },
  matches: {
    update: {
      method: "PATCH" as const,
      path: "/api/matches/:id",
      input: insertMatchSchema.partial().extend({
        advanceWinner: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof matches.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
