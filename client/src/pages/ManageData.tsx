// client/src/pages/ManageData.tsx
import { useState } from "react";
import { Plus, Users, UserPlus, Sparkles } from "lucide-react";
import { usePlayers, useTeams, useCreatePlayer, useCreateTeam } from "@/hooks/use-tournament";
import { TeamCard } from "@/components/TeamCard";
import { useToast } from "@/hooks/use-toast";

export default function ManageData() {
  const { data: players, isLoading: loadingPlayers } = usePlayers();
  const { data: teams, isLoading: loadingTeams } = useTeams();
  const { toast } = useToast();
  
  const createPlayer = useCreatePlayer();
  const createTeam = useCreateTeam();

  const [playerName, setPlayerName] = useState("");
  const [teamForm, setTeamForm] = useState({ name: "", p1: "", p2: "" });

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    try {
      await createPlayer.mutateAsync({ name: playerName });
      setPlayerName("");
      toast({ title: "Success", description: "Player added successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create player", variant: "destructive" });
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.p1 || !teamForm.p2) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (teamForm.p1 === teamForm.p2) {
      toast({ title: "Error", description: "Players must be different", variant: "destructive" });
      return;
    }
    try {
      await createTeam.mutateAsync({
        name: teamForm.name,
        player1Id: parseInt(teamForm.p1),
        player2Id: parseInt(teamForm.p2),
      });
      setTeamForm({ name: "", p1: "", p2: "" });
      toast({ title: "Success", description: "Team created successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create team", variant: "destructive" });
    }
  };

  const usedPlayerIds = new Set<number>();
teams?.forEach((t) => {
  if (t.player1Id) usedPlayerIds.add(t.player1Id);
  if (t.player2Id) usedPlayerIds.add(t.player2Id);
});



const availablePlayers = (players ?? []).filter((p) => !usedPlayerIds.has(p.id));

const availableForP1 = availablePlayers;
const availableForP2 = availablePlayers.filter(p => String(p.id) !== teamForm.p1);
const totalPlayers = players?.length ?? 0;
const usedCount = usedPlayerIds.size;
const availableCount = availablePlayers.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
          Tournament Setup
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your roster. Add players first, then form teams to compete in the bracket.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* PLAYER MANAGEMENT */}
        <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 p-2 rounded-lg">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-display">Add Players</h2>
          </div>

          <form onSubmit={handleCreatePlayer} className="flex gap-4 mb-8">
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name..."
              className="flex-1 px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
            <button
              disabled={createPlayer.isPending || !playerName.trim()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {createPlayer.isPending ? "Adding..." : <><Plus className="w-5 h-5" /> Add</>}
            </button>
          </form>

<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      Roster
    </h3>
    <span className="text-xs text-muted-foreground">
      Available {availableCount} / Total {totalPlayers} (Used {usedCount})
    </span>
  </div>

  {loadingPlayers || loadingTeams ? (
    <div className="text-center py-8 text-muted-foreground animate-pulse">
      Loading players...
    </div>
  ) : totalPlayers === 0 ? (
    <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground">
      No players added yet
    </div>
  ) : availableCount === 0 ? (
    <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground">
      All players are already assigned to teams
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {availablePlayers.map((player) => (
        <div
          key={player.id}
          className="bg-secondary/30 p-3 rounded-lg border border-border/50 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-medium truncate">{player.name}</span>
        </div>
      ))}
    </div>
  )}
</div>

        </section>

        {/* TEAM MANAGEMENT */}
        <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-accent/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold font-display">Form Teams</h2>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-4 mb-8 bg-secondary/20 p-5 rounded-xl border border-border/50">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Team Name</label>
              <input
                value={teamForm.name}
                onChange={(e) => setTeamForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. The Avengers"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Player 1</label>
                <select
                  value={teamForm.p1}
                  onChange={(e) => setTeamForm(p => ({ ...p, p1: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                >
                  <option value="">Select...</option>
                  {availableForP1?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Player 2</label>
                <select
                  value={teamForm.p2}
                  onChange={(e) => setTeamForm(p => ({ ...p, p2: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                >
                  <option value="">Select...</option>
                  {availableForP2?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <button
              disabled={createTeam.isPending || !teamForm.name || !teamForm.p1 || !teamForm.p2}
              className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              {createTeam.isPending ? "Creating..." : <><Sparkles className="w-4 h-4" /> Create Team</>}
            </button>
          </form>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Teams</h3>
            {loadingTeams ? (
              <div className="text-center py-8 text-muted-foreground">Loading teams...</div>
            ) : teams?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                No teams created yet
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {teams?.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
