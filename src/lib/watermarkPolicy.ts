import { supabase } from "@/integrations/supabase/client";
import type { ProjectSettings } from "@/lib/types";

/**
 * Server-verified watermark policy.
 *
 * The animation engines never trust `settings.hideWatermark` on its own.
 * They route every render through `enforceWatermarkSettings`, which only
 * allows the watermark to be hidden when this module's cached `allowHide`
 * flag is `true`. The flag is *only* flipped by `refreshWatermarkPolicy`,
 * which checks the authenticated user's `is_premium` row + `premium_until`
 * directly from the backend.
 *
 * Default: locked. So if the refresh has never run, or the user is signed
 * out, or any client-side tampering tries to bypass the gate, the
 * watermark renders regardless of what the project settings say.
 */
let allowHide = false;
let lastCheckedAt = 0;

export function getWatermarkPolicy() {
  return { allowHide, lastCheckedAt };
}

/** Force-lock the watermark (used on sign-out and as the safe default). */
export function lockWatermark() {
  allowHide = false;
  lastCheckedAt = Date.now();
}

/**
 * Refresh the policy from the backend. Returns true if the current user is
 * verified premium and is allowed to hide the watermark.
 *
 * Called right before every export so the lock can't be desynced by stale
 * client state.
 */
export async function refreshWatermarkPolicy(): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      allowHide = false;
      lastCheckedAt = Date.now();
      return false;
    }
    const { data, error } = await supabase
      .from("user_credits")
      .select("is_premium,premium_until")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) {
      // Fail closed — never unlock on a backend error.
      allowHide = false;
      lastCheckedAt = Date.now();
      return false;
    }
    const premium = !!data?.is_premium;
    const stillActive =
      !data?.premium_until || new Date(data.premium_until).getTime() > Date.now();
    allowHide = premium && stillActive;
    lastCheckedAt = Date.now();
    return allowHide;
  } catch {
    allowHide = false;
    lastCheckedAt = Date.now();
    return false;
  }
}

/**
 * Sanitize project settings so that `hideWatermark` only takes effect when
 * the server-verified policy allows it. Animation engines call this at the
 * start of every render run.
 */
export function enforceWatermarkSettings<T extends Partial<ProjectSettings>>(settings: T): T {
  if (!settings) return settings;
  if (settings.hideWatermark && !allowHide) {
    return { ...settings, hideWatermark: false };
  }
  return settings;
}
