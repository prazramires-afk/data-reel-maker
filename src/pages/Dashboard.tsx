import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Video, Eye, Heart, Share2, Download, Plus, ExternalLink } from "lucide-react";
import { Seo } from "@/components/Seo";
import { getMyProfile, Profile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  totalVideos: number;
  publishedVideos: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
}

interface RecentProject {
  id: string;
  name: string;
  is_public: boolean;
  view_count: number;
  updated_at: string;
}

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) => (
  <div className="bg-card rounded-2xl p-4 border border-border/50">
    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <div className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0, publishedVideos: 0, totalViews: 0, totalLikes: 0, totalShares: 0, totalDownloads: 0,
  });
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const [topVideo, setTopVideo] = useState<RecentProject | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyProfile().then(setProfile);
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id,name,is_public,view_count,like_count,share_count,download_count,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      const rows = data ?? [];
      const s: Stats = {
        totalVideos: rows.length,
        publishedVideos: rows.filter((r: any) => r.is_public).length,
        totalViews: rows.reduce((a: number, r: any) => a + (r.view_count || 0), 0),
        totalLikes: rows.reduce((a: number, r: any) => a + (r.like_count || 0), 0),
        totalShares: rows.reduce((a: number, r: any) => a + (r.share_count || 0), 0),
        totalDownloads: rows.reduce((a: number, r: any) => a + (r.download_count || 0), 0),
      };
      setStats(s);
      setRecent(rows.slice(0, 5) as RecentProject[]);
      const top = [...rows].sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))[0];
      if (top) setTopVideo(top as RecentProject);
    })();
  }, [user]);

  return (
    <>
      <Seo
        title="Creator Dashboard — Data to Video"
        description="Manage your videos, profile, and analytics."
        path="/dashboard"
        noindex
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
          </h1>
          {profile && (
            <Link
              to={`/u/${profile.username}`}
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1"
            >
              @{profile.username} <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> New Video
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Stat icon={Video} label="Total videos" value={stats.totalVideos} />
        <Stat icon={Globe} label="Published" value={stats.publishedVideos} />
        <Stat icon={Eye} label="Total views" value={stats.totalViews} />
        <Stat icon={Heart} label="Total likes" value={stats.totalLikes} />
        <Stat icon={Share2} label="Total shares" value={stats.totalShares} />
        <Stat icon={Download} label="Total downloads" value={stats.totalDownloads} />
      </div>

      {topVideo && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Most popular</h2>
          <Link
            to={`/create?edit=${topVideo.id}`}
            className="block bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate">{topVideo.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {topVideo.view_count.toLocaleString()} views
                </div>
              </div>
              <Eye className="w-5 h-5 text-primary shrink-0" />
            </div>
          </Link>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
          <Link to="/dashboard/videos" className="text-xs text-primary font-semibold">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
            <p className="text-muted-foreground mb-4">No videos yet</p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm"
            >
              <Plus className="w-4 h-4" /> Create your first video
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((r) => (
              <Link
                key={r.id}
                to={`/create?edit=${r.id}`}
                className="flex items-center justify-between bg-card rounded-xl p-3 border border-border/50 hover:border-primary/50"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleDateString()} · {r.is_public ? "Public" : "Private"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 ml-3">{(r.view_count || 0).toLocaleString()} views</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

// Local icon import to avoid name clash above
import { Globe } from "lucide-react";

export default Dashboard;