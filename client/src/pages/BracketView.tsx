import { useState } from "react";
import { useRoute } from "wouter";
import {
  useTournament,
  useTournamentMatches,
  useUpdateMatch,
  useTeams,
} from "@/hooks/use-tournament";
import { Loader2, Trophy, Plus, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TeamCard } from "@/components/TeamCard";
import type { MatchWithTeams, TeamWithPlayers } from "@shared/schema";
import { clsx } from "clsx";

export default function BracketView() {
  const [, params] = useRoute("/tournaments/:id");
  const id = parseInt(params?.id || "0");
  const { data: tournament, isLoading: loadingTourney } = useTournament(id);
  const { data: matches, isLoading: loadingMatches } = useTournamentMatches(id);
  const { data: allTeams } = useTeams();

  if (loadingTourney || loadingMatches) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament || !matches) return <div>Tournament not found</div>;

  // Group matches by round
  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  // Sort matches within rounds by order
  Object.keys(rounds).forEach((key) => {
    rounds[Number(key)].sort((a, b) => a.matchOrder - b.matchOrder);
  });

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);
  const maxRound = Math.max(...roundNumbers);

  return (
    <div className="min-h-screen bg-muted/20 pb-20 overflow-x-auto">
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        <div className="mb-8">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Tournament Bracket
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-bold mt-1">
            {tournament.name}
          </h1>
        </div>

        <div className="flex gap-16 min-w-max pb-8">
          {roundNumbers.map((round) => (
            <div
              key={round}
              className="flex flex-col justify-around gap-8 w-80"
            >
              <div className="text-center font-bold text-muted-foreground uppercase tracking-widest text-sm mb-4">
                {round === maxRound
                  ? "Finals"
                  : round === maxRound - 1
                  ? "Semi-Finals"
                  : `Round ${round}`}
              </div>

              <div className="flex flex-col justify-around grow gap-8">
                {rounds[round].map((match) => (
                  <MatchNode
                    key={match.id}
                    match={match}
                    isLeaf={round === 1}
                    availableTeams={allTeams || []}
                    matches={matches} // Pass all matches to filter used teams
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Winner Column */}
          <div className="flex flex-col justify-center w-64">
            <div className="text-center font-bold text-primary uppercase tracking-widest text-sm mb-4">
              Champion
            </div>
            <div className="border-2 border-primary/20 bg-primary/5 rounded-2xl p-6 text-center h-48 flex flex-col items-center justify-center">
              <Trophy className="w-12 h-12 text-primary mb-3" />
              {(() => {
                const finalMatch = rounds[maxRound]?.[0];
                if (finalMatch?.winner) {
                  return (
                    <div className="font-display font-bold text-xl text-foreground">
                      {finalMatch.winner.name}
                    </div>
                  );
                }
                return <div className="text-muted-foreground">TBD</div>;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchNode({
  match,
  isLeaf,
  availableTeams,
  matches,
}: {
  match: MatchWithTeams;
  isLeaf: boolean;
  availableTeams: TeamWithPlayers[];
  matches: MatchWithTeams[];
}) {
  const updateMatch = useUpdateMatch();
  const [score1, setScore1] = useState(match.score1?.toString() || "0");
  const [score2, setScore2] = useState(match.score2?.toString() || "0");
  const [isHovered, setIsHovered] = useState(false);

  // Filter out teams already assigned to any match in the tournament
  const usedTeamIds = new Set<number>();
  matches.forEach((m) => {
    if (m.team1Id) usedTeamIds.add(m.team1Id);
    if (m.team2Id) usedTeamIds.add(m.team2Id);
  });

  const availableForSelection = availableTeams.filter(
    (t) => !usedTeamIds.has(t.id)
  );

  const handleTeamSelect = (teamId: number, position: "team1" | "team2") => {
    updateMatch.mutate({
      id: match.id,
      updates: {
        [position === "team1" ? "team1Id" : "team2Id"]: teamId,
      },
    });
  };

  const handleSaveScore = () => {
    updateMatch.mutate({
      id: match.id,
      updates: {
        score1: parseInt(score1),
        score2: parseInt(score2),
        advanceWinner: true, // Custom flag for backend logic
      },
    });
  };

  const handleRemoveTeam = (id: number) => {
    updateMatch.mutate({
      id: match.id,
      updates: {
        [id === match.team1Id ? "team1Id" : "team2Id"]: null,
      },
    });
  };

  const isCompleted = !!match.winnerId;

  return (
    <div
      className={clsx(
        "relative bg-card rounded-xl border-2 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg",
        isCompleted ? "border-primary/50 shadow-primary/5" : "border-border",
        isHovered && "ring-2 ring-primary/20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col divide-y divide-border">
        {/* Team 1 Slot */}
        <TeamSlot
          team={match.team1}
          score={score1}
          setScore={setScore1}
          isWinner={match.winnerId === match.team1Id}
          placeholder="Team 1"
          canSelect={isLeaf && !match.team1Id}
          onSelect={(tid) => handleTeamSelect(tid, "team1")}
          availableTeams={availableForSelection}
          readOnly={isCompleted}
          onDelete={handleRemoveTeam}
        />

        {/* Team 2 Slot */}
        <TeamSlot
          team={match.team2}
          score={score2}
          setScore={setScore2}
          isWinner={match.winnerId === match.team2Id}
          placeholder="Team 2"
          canSelect={isLeaf && !match.team2Id}
          onSelect={(tid) => handleTeamSelect(tid, "team2")}
          availableTeams={availableForSelection}
          readOnly={isCompleted}
          onDelete={handleRemoveTeam}
        />
      </div>

      {/* Action Footer */}
      {match.team1 && match.team2 && !isCompleted && (
        <div className="bg-muted/30 p-2 flex justify-end">
          <button
            onClick={handleSaveScore}
            disabled={updateMatch.isPending}
            className="text-xs font-bold flex items-center gap-1 text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-md"
          >
            {updateMatch.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save & Advance
          </button>
        </div>
      )}
    </div>
  );
}

function TeamSlot({
  team,
  score,
  setScore,
  isWinner,
  placeholder,
  canSelect,
  onSelect,
  availableTeams,
  readOnly,
  onDelete,
}: {
  team?: any;
  score: string;
  setScore: (s: string) => void;
  isWinner: boolean;
  placeholder: string;
  canSelect: boolean;
  onSelect: (id: number) => void;
  availableTeams: TeamWithPlayers[];
  readOnly: boolean;
  onDelete?: (id: number) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div
      className={clsx(
        "p-3 flex items-center justify-between gap-3 h-14",
        isWinner && "bg-primary/5"
      )}
    >
      {team ? (
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={clsx(
              "w-2 h-2 rounded-full shrink-0",
              isWinner ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
          <span
            className={clsx(
              "font-semibold truncate text-sm",
              isWinner ? "text-primary" : "text-foreground"
            )}
          >
            {team.name}
          </span>
          <X
            onClick={() => {
              if (onDelete) {
                onDelete(team.id);
              }
            }}
            className="w-3 h-3 text-muted-foreground"
          />
        </div>
      ) : canSelect ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors border border-dashed border-border hover:border-primary/50 px-3 py-1 rounded-md w-full justify-center">
              <Plus className="w-3 h-3" /> Select Team
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Team for {placeholder}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto pt-2">
              {availableTeams.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No available teams. Go create more!
                </p>
              ) : (
                availableTeams.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelect(t.id);
                      setDialogOpen(false);
                    }}
                    className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.player1?.name} & {t.player2?.name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <span className="text-sm text-muted-foreground/50 italic px-2">
          TBD
        </span>
      )}

      {team && (
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          disabled={readOnly}
          className={clsx(
            "w-10 h-8 rounded text-center font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
            readOnly ? "bg-transparent" : "bg-muted/50"
          )}
        />
      )}
    </div>
  );
}
