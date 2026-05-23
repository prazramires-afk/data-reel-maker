import { useNavigate } from "react-router-dom";
import { Play, FolderOpen, Layout, LogIn, LogOut, Sparkles, Coins, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const navigate = useNavigate();
  const { user, credits, signOut, isAdmin } = useAuth();
  const dailyCap = credits?.is_premium ? 50 : 10;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: "hsl(252 85% 60%)" }} />

      {/* Top-right auth area */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {user ? (
          <>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
              {credits?.is_premium ? (
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Coins className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {credits?.tokens ?? 0}/{dailyCap}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-full bg-secondary text-muted-foreground active:scale-90 transition-transform"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-foreground text-xs font-semibold active:scale-95 transition-transform"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign in
          </button>
        )}
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        <h1
          className="text-5xl font-extrabold tracking-tight text-foreground opacity-0 animate-fade-in"
          style={{ lineHeight: "1.1" }}
        >
          Data to Video
        </h1>
        <p className="mt-4 text-muted-foreground text-lg opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          Turn your data into viral videos
        </p>

        <div className="mt-12 flex flex-col gap-4 opacity-0 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform duration-150"
          >
            <Play className="w-5 h-5" />
            Create New Video
          </button>

          <button
            onClick={() => navigate("/projects")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-base active:scale-[0.97] transition-transform duration-150"
          >
            <FolderOpen className="w-5 h-5" />
            My Projects
          </button>

          <button
            onClick={() => navigate("/templates")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-base active:scale-[0.97] transition-transform duration-150"
          >
            <Layout className="w-5 h-5" />
            Templates
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-primary/40 bg-card text-foreground font-semibold text-base active:scale-[0.97] transition-transform duration-150"
            >
              <Shield className="w-5 h-5 text-primary" />
              Admin Panel
            </button>
          )}

          {user && !credits?.is_premium && (
            <button
              onClick={() => navigate("/create?upgrade=1")}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-transform shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Premium — $10/mo
            </button>
          )}
        </div>

        {user && (
          <p className="mt-6 text-xs text-muted-foreground">
            {credits?.is_premium ? "Premium" : "Free"} · {credits?.tokens ?? 0} tokens left today · 5 tokens / video
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;
