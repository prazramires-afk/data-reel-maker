import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check, Twitter, Facebook, MessageCircle, Send, Linkedin } from "lucide-react";
import { Project } from "@/lib/types";
import { getProjectById } from "@/lib/storage";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { CommunityProjectCard } from "@/components/CommunityProjectCard";
import { communityUrl, copyToClipboard, shareLinks } from "@/lib/share";
import { toast } from "@/hooks/use-toast";

const CommunityProject = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getProjectById(id).then((p) => {
      // Only show if actually public
      if (p && p.isPublic) setProject(p);
      else setProject(null);
    });
  }, [id]);

  if (project === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (project === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-foreground font-semibold">This community video is unavailable.</p>
        <Link to="/community" className="mt-4 text-primary font-semibold">Browse community →</Link>
      </div>
    );
  }

  const url = communityUrl(project.id);
  const text = `${project.settings?.title || project.name} — animated data video built with Data to Video`;
  const links = shareLinks(url, text);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={`${project.settings?.title || project.name} — Community Data Video`}
        description={`Animated data video by ${project.authorName || "a Data to Video creator"}.`}
        path={`/community/${project.id}`}
      />
      <div className="max-w-3xl mx-auto px-5 py-6 w-full flex-1">
        <button onClick={() => navigate("/community")} className="flex items-center gap-2 text-muted-foreground mb-6 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" /> Community
        </button>

        <CommunityProjectCard project={project} />

        <div className="mt-6 bg-card rounded-2xl p-5 border border-border">
          <h1 className="text-2xl font-bold text-foreground">{project.settings?.title || project.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Published {project.publishedAt ? new Date(project.publishedAt).toLocaleDateString() : ""}
            {project.authorName ? ` · by ${project.authorName}` : ""}
          </p>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Share</p>
            <div className="flex flex-wrap gap-2">
              <a href={links.twitter} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95 transition-transform">
                <Twitter className="w-4 h-4" /> X / Twitter
              </a>
              <a href={links.facebook} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95 transition-transform">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
              <a href={links.whatsapp} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95 transition-transform">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a href={links.telegram} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95 transition-transform">
                <Send className="w-4 h-4" /> Telegram
              </a>
              <a href={links.linkedin} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95 transition-transform">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
              <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <Link to="/create" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Create your own video
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommunityProject;