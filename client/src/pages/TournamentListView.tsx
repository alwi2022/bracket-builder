import { Link } from "wouter";
import { Trophy, Plus, ArrowRight, Calendar } from "lucide-react";
import { useTournaments, useCreateTournament } from "@/hooks/use-tournament";
import { useToast } from "@/hooks/use-toast";

export default function TournamentListView() {
  const { data: tournaments, isLoading } = useTournaments();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold">Tournaments</h1>
          <p className="text-muted-foreground mt-1">
            Manage active brackets and history
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted/20 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : tournaments?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold">No Tournaments Yet</h3>
          <p className="text-muted-foreground mt-2">
            Create your first tournament bracket to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments?.map((tournament) => (
            <Link key={tournament.id} href={`/tournaments/view/${tournament.id}`}>
              <div className="group bg-card border border-border hover:border-primary/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                      tournament.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {tournament.status.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors">
                  {tournament.name}
                </h3>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    <span>{tournament.teamCount} Teams</span>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
