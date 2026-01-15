import { User } from "lucide-react";
import type { TeamWithPlayers } from "@shared/schema";

interface TeamCardProps {
  team: TeamWithPlayers;
  onClick?: () => void;
  className?: string;
}

export function TeamCard({ team, onClick, className }: TeamCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-card border border-border/50 rounded-xl p-4
        shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30
        transition-all duration-300 group cursor-default
        ${onClick ? 'cursor-pointer' : ''}
        ${className || ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
          {team.name}
        </h3>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
          {team.name.substring(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4 text-primary/60" />
          <span className="font-medium text-foreground/80">{team.player1?.name || "Player 1"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4 text-accent/60" />
          <span className="font-medium text-foreground/80">{team.player2?.name || "Player 2"}</span>
        </div>
      </div>
    </div>
  );
}
