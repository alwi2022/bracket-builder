import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ManageData from "@/pages/ManageData";
import TournamentList from "@/pages/TournamentList";
import BracketView from "@/pages/BracketView";
import TournamentListView from "./pages/TournamentListView";
import { Navbar } from "./components/Navbar";
import BracketViewPublic from "./pages/BracketViewPublic";
import React, { useEffect, useState } from "react";
import { authenticate, isAuthenticated } from "./auth";

type Props = {
  component: React.ComponentType<any>;
  path: string;
};

export function ProtectedRoute({ component: Component, path }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setAllowed(true);
      return;
    }

    const password = window.prompt("Enter password");

    if (password && authenticate(password)) {
      setAllowed(true);
    } else {
      setAllowed(false);
    }
  }, []);

  if (allowed === null) return null;

  if (!allowed) return <Redirect to="/tournaments/view" />;

  return <Route path={path} component={Component} />;
}

function Router() {
  const [location] = useLocation();
  const hideNavbar = location.startsWith("/tournaments/view");
  return (
    <div className="min-h-screen bg-background font-sans">
      {!hideNavbar && <Navbar />}
      <main>
        <Switch>
          <ProtectedRoute path="/" component={ManageData} />
          <ProtectedRoute path="/tournaments" component={TournamentList} />
          <Route path="/tournaments/view" component={TournamentListView} />
          <Route path="/tournaments/view/:id" component={BracketViewPublic} />
          <ProtectedRoute path="/tournaments/:id" component={BracketView} />

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
