import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface UserCredits {
  tokens: number;
  is_premium: boolean;
  premium_until: string | null;
  last_reset: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  credits: UserCredits | null;
  refreshCredits: () => Promise<void>;
  consumeTokens: (cost: number) => Promise<{ success: boolean; tokens_remaining: number; is_premium: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<UserCredits | null>(null);

  const fetchCredits = useCallback(async (uid: string) => {
    // Calling consume_tokens with cost 0 also performs the daily reset + premium expiry check.
    const { data, error } = await supabase.rpc("consume_tokens", { cost: 0 });
    if (error) {
      console.warn("consume_tokens probe failed, falling back to select", error);
      const { data: row } = await supabase
        .from("user_credits")
        .select("tokens,is_premium,premium_until,last_reset")
        .eq("user_id", uid)
        .maybeSingle();
      if (row) setCredits(row as UserCredits);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      // Need premium_until + last_reset too — fetch full row
      const { data: full } = await supabase
        .from("user_credits")
        .select("tokens,is_premium,premium_until,last_reset")
        .eq("user_id", uid)
        .maybeSingle();
      if (full) setCredits(full as UserCredits);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    if (user) await fetchCredits(user.id);
  }, [user, fetchCredits]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer to avoid deadlock
        setTimeout(() => fetchCredits(newSession.user.id), 0);
      } else {
        setCredits(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchCredits(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchCredits]);

  const consumeTokens = useCallback(
    async (cost: number) => {
      const { data, error } = await supabase.rpc("consume_tokens", { cost });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const result = {
        success: !!row?.success,
        tokens_remaining: row?.tokens_remaining ?? 0,
        is_premium: !!row?.is_premium,
      };
      if (user) await fetchCredits(user.id);
      return result;
    },
    [user, fetchCredits]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, credits, refreshCredits, consumeTokens, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};