import { useRoute } from "wouter";
import { useTournament, useTournamentMatches, useTournamentMatchesView, useTournamentView } from "@/hooks/use-tournament";
import { Loader2, Trophy } from "lucide-react";
import type { MatchWithTeams } from "@shared/schema";
import { clsx } from "clsx";

export default function BracketViewPublic() {
  const [, params] = useRoute("/tournaments/view/:id");
  const id = Number(params?.id);


  const { data: tournament, isLoading: loadingTourney } = useTournamentView(id);
  const { data: matches, isLoading: loadingMatches } = useTournamentMatchesView(id);

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

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
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
            <div key={round} className="flex flex-col justify-around gap-8 w-80">
              <div className="text-center font-bold text-muted-foreground uppercase tracking-widest text-sm mb-4">
                {round === maxRound
                  ? "Finals"
                  : round === maxRound - 1
                  ? "Semi-Finals"
                  : `Round ${round}`}
              </div>

              <div className="flex flex-col justify-around grow gap-8">
                {rounds[round].map((match) => (
                  <MatchNodePublic
                    key={match.id}
                    match={match}
                    isLeaf={round === 1}
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

function MatchNodePublic({
  match,
  isLeaf,
}: {
  match: MatchWithTeams;
  isLeaf: boolean;
}) {
  const isCompleted = !!match.winnerId;

  return (
    <div
      className={clsx(
        "relative bg-card rounded-xl border-2 transition-all duration-300 overflow-hidden shadow-sm",
        isCompleted ? "border-primary/50 shadow-primary/5" : "border-border"
      )}
    >
      <div className="flex flex-col divide-y divide-border">
        <TeamSlotPublic
          teamName={match.team1?.name}
          score={match.score1 ?? 0}
          isWinner={match.winnerId === match.team1Id}
          placeholder={isLeaf ? "TBD" : "—"}
        />

        <TeamSlotPublic
          teamName={match.team2?.name}
          score={match.score2 ?? 0}
          isWinner={match.winnerId === match.team2Id}
          placeholder={isLeaf ? "TBD" : "—"}
        />
      </div>
    </div>
  );
}

function TeamSlotPublic({
  teamName,
  score,
  isWinner,
  placeholder,
}: {
  teamName?: string;
  score: number;
  isWinner: boolean;
  placeholder: string;
}) {
  return (
    <div
      className={clsx(
        "p-3 flex items-center justify-between gap-3 h-14",
        isWinner && "bg-primary/5"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={clsx(
            "w-2 h-2 rounded-full shrink-0",
            isWinner ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
        {teamName ? (
          <span
            className={clsx(
              "font-semibold truncate text-sm",
              isWinner ? "text-primary" : "text-foreground"
            )}
          >
            {teamName}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/60 italic">{placeholder}</span>
        )}
      </div>

      {/* Score display (read-only) */}
      <div
        className={clsx(
          "w-10 h-8 rounded flex items-center justify-center font-mono font-bold text-sm",
          "bg-muted/40"
        )}
      >
        {score}
      </div>
    </div>
  );
}
