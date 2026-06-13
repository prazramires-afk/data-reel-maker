import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Twitter,
  Youtube,
  Music2,
  Eye,
  Heart,
  Share2,
  Video as VideoIcon,
  Copy,
  Check,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { getPublicProfileByUsername, PublicProfile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { copyToClipboard } from "@/lib/share";
import { toast } from "@/hooks/use-toast";

interface PublicVideo {
  id: string;
  name: string;
  description: string | null;
  view_count: number;
  published_at: string;
}

const SITE = "https://data-reel-maker.lovable.app";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getPublicProfileByUsername(username).then(async (p) => {
      setProfile(p);
      if (p) {
        const { data } = await supabase
          .from("projects")
          .select("id,name,description,view_count,published_at")
          .eq("user_id", p.id)
          .eq("is_public", true)
          .order("published_at", { ascending: false });
        setVideos((data ?? []) as PublicVideo[]);
      }
      setLoading(false);
    });
  }, [username]);

  const handleShare = async () => {
    const url = `${SITE}/u/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: profile?.display_name || `@${username}`, url });
        return;
      } catch {}
    }
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      toast({ title: "Profile link copied" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="min-h-screen" />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen px-5 py-10 max-w-lg mx-auto text-center">
        <Seo title="Creator not found" description="This creator profile doesn't exist." path={`/u/${username}`} noindex />
        <h1 className="text-2xl font-bold mb-2">Creator not found</h1>
        <p className="text-muted-foreground mb-6">No creator with username @{username}.</p>
        <Link to="/community" className="text-primary font-semibold">Browse community</Link>
      </div>
    );
  }

  const displayName = profile.display_name || `@${profile.username}`;
  const description = profile.bio || `${displayName} on Data to Video — ${profile.total_videos} public videos, ${profile.total_views.toLocaleString()} views.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: displayName,
      alternateName: `@${profile.username}`,
      description: profile.bio || undefined,
      image: profile.avatar_url || undefined,
      url: `${SITE}/u/${profile.username}`,
      sameAs: [profile.website_url, profile.twitter_url, profile.youtube_url, profile.tiktok_url].filter(Boolean),
    },
  };
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen px-5 py-6 max-w-3xl mx-auto">
      <Seo
        title={`${displayName} (@${profile.username}) — Data to Video`}
        description={description}
        path={`/u/${profile.username}`}
        ogImage={profile.avatar_url ?? undefined}
        jsonLd={jsonLd}
      />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground mb-6 active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      {/* Hero */}
      <header className="bg-card rounded-3xl p-6 border border-border/50 mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden text-3xl font-bold mb-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <div className="text-sm text-muted-foreground">@{profile.username}</div>
          {profile.bio && <p className="text-sm text-foreground mt-3 max-w-md whitespace-pre-line">{profile.bio}</p>}

          {/* Social links */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {profile.website_url && (
              <SocialLink href={profile.website_url} icon={Globe} label="Website" />
            )}
            {profile.twitter_url && (
              <SocialLink href={profile.twitter_url} icon={Twitter} label="X" />
            )}
            {profile.youtube_url && (
              <SocialLink href={profile.youtube_url} icon={Youtube} label="YouTube" />
            )}
            {profile.tiktok_url && (
              <SocialLink href={profile.tiktok_url} icon={Music2} label="TikTok" />
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <button
              disabled
              title="Follow coming soon"
              className="px-4 py-2 rounded-xl bg-primary/40 text-primary-foreground font-semibold text-sm cursor-not-allowed"
            >
              Follow
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm active:scale-95 transition-transform"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Share profile"}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-6 w-full max-w-md">
            <Stat icon={VideoIcon} value={profile.total_videos} label="Videos" />
            <Stat icon={Eye} value={profile.total_views} label="Views" />
            <Stat icon={Heart} value={profile.total_likes} label="Likes" />
            <Stat icon={Share2} value={profile.total_shares} label="Shares" />
          </div>
        </div>
      </header>

      {/* Videos */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Videos</h2>
        {videos.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border/50 text-muted-foreground text-sm">
            No public videos yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {videos.map((v) => (
              <Link
                key={v.id}
                to={`/community/${v.id}`}
                className="bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="font-semibold text-foreground truncate">{v.name}</div>
                {v.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                  <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {(v.view_count || 0).toLocaleString()}</span>
                  <span>·</span>
                  <span>{new Date(v.published_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Stat = ({ icon: Icon, value, label }: { icon: any; value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <Icon className="w-4 h-4 text-muted-foreground mb-1" />
    <div className="font-bold text-foreground">{value.toLocaleString()}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

const SocialLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full text-xs font-semibold text-secondary-foreground hover:bg-primary/15 hover:text-primary transition-colors"
  >
    <Icon className="w-3 h-3" /> {label}
  </a>
);

export default UserProfile;