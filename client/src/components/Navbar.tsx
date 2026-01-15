import { Link, useLocation } from "wouter";
import { Trophy, Users, GitMerge } from "lucide-react";
import { clsx } from "clsx";

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              TourneyPro
            </span>
          </Link>

          <div className="flex space-x-1 sm:space-x-4">
            <NavLink 
              href="/" 
              active={location === "/"} 
              icon={<Users className="w-4 h-4 mr-2" />}
            >
              Teams & Players
            </NavLink>
            <NavLink 
              href="/tournaments" 
              active={location.startsWith("/tournaments")} 
              icon={<GitMerge className="w-4 h-4 mr-2" />}
            >
              Tournaments
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active, icon }: { href: string; children: React.ReactNode; active: boolean; icon: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        active 
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
