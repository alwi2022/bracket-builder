import { Switch, Route, useLocation } from "wouter";
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

function Router() {
    const [location] = useLocation();
  const hideNavbar = location.startsWith("/tournaments/view");
  return (
    <div className="min-h-screen bg-background font-sans">
       {!hideNavbar && <Navbar />}
      <main>
        <Switch>
          <Route path="/" component={ManageData} />
          <Route path="/tournaments" component={TournamentList} />
          <Route path="/tournaments/view" component={TournamentListView} />
          <Route path="/tournaments/view/:id" component={BracketViewPublic} />
          <Route path="/tournaments/:id" component={BracketView} />
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
