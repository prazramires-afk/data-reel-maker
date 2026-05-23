import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/", { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser navigates away
      navigate("/", { replace: true });
    } catch {
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto px-5 py-6">
      <Seo
        title="Sign in — Data to Video"
        description="Sign in or create a Data to Video account to save projects and export animated data videos."
        path="/auth"
        noindex
      />
      <button onClick={() => navigate("/")} className="p-1.5 -ml-1.5 active:scale-90 transition-transform w-fit">
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-extrabold text-foreground">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {mode === "signin" ? "Sign in to keep generating videos." : "Sign up to get 10 free tokens daily."}
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mt-8 w-full py-3.5 rounded-xl bg-card border border-border text-foreground font-semibold flex items-center justify-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 6 chars)"
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-primary font-medium mx-auto"
        >
          {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
};

export default Auth;