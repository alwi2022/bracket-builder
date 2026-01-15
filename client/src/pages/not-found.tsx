import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold font-display text-foreground">404 Page Not Found</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Link href="/">
          <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
