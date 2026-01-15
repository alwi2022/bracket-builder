import { useState } from "react";
import { Link } from "wouter";
import { Trophy, Plus, ArrowRight, Calendar } from "lucide-react";
import { useTournaments, useCreateTournament } from "@/hooks/use-tournament";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TournamentList() {
  const { data: tournaments, isLoading } = useTournaments();
  const createTournament = useCreateTournament();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", teamCount: "4" });

  const handleCreate = async () => {
    if (!formData.name) return;
    try {
      await createTournament.mutateAsync({
        name: formData.name,
        teamCount: parseInt(formData.teamCount)
      });
      setOpen(false);
      setFormData({ name: "", teamCount: "4" });
      toast({ title: "Success", description: "Tournament created!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to create tournament", variant: "destructive" });
    }
  };
  

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold">Tournaments</h1>
          <p className="text-muted-foreground mt-1">Manage active brackets and history</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Tournament
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Tournament</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tournament Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Summer Championship 2025"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bracket Size</label>
                <select
                  value={formData.teamCount}
                  onChange={e => setFormData(p => ({ ...p, teamCount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="4">4 Teams</option>
                  <option value="8">8 Teams</option>
                  <option value="16">16 Teams</option>
                </select>
                <p className="text-xs text-muted-foreground">This determines the size of the bracket tree.</p>
              </div>
              <button
                onClick={handleCreate}
                disabled={createTournament.isPending || !formData.name}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 mt-4"
              >
                {createTournament.isPending ? "Creating..." : "Create Bracket"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : tournaments?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold">No Tournaments Yet</h3>
          <p className="text-muted-foreground mt-2">Create your first tournament bracket to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments?.map(tournament => (
            <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
              <div className="group bg-card border border-border hover:border-primary/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                    tournament.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {tournament.status.replace('_', ' ')}
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
