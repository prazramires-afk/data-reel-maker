import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check, Twitter, Facebook, MessageCircle, Send, Linkedin, Eye, Download as DownloadIcon, Repeat2 } from "lucide-react";
import { Project } from "@/lib/types";
import {
  getCommunityProjectByParam,
  getProfileByUserId,
  getRelatedCommunityProjects,
} from "@/lib/storage";
import { recordProjectEvent } from "@/lib/profile";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { CommunityProjectCard } from "@/components/CommunityProjectCard";
import { communityUrl, copyToClipboard, shareLinks } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import { isCategorySlug, getCategory, CATEGORIES } from "@/lib/seo/categories";
import CommunityCategory from "./CommunityCategory";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { DatasetTable } from "@/components/article/DatasetTable";
import { KeyInsights } from "@/components/article/KeyInsights";
import { FaqAccordion } from "@/components/article/FaqAccordion";
import { RelatedVideos } from "@/components/article/RelatedVideos";
import { RelatedDatasets } from "@/components/article/RelatedDatasets";
import { AuthorCard } from "@/components/article/AuthorCard";
import { breadcrumbLd, datasetLd, faqLd, videoObjectLd } from "@/lib/seo/jsonLd";
import { LikeButton } from "@/components/community/LikeButton";
import { RemixButton } from "@/components/community/RemixButton";
import { TagChips } from "@/components/community/TagChips";
import { useState as useReactState } from "react";
import { getDatasetById, type Dataset } from "@/lib/datasets";
import { Database } from "lucide-react";

const CommunityProject = () => {
  const { id: param = "" } = useParams();
  if (isCategorySlug(param)) {
    const cat = getCategory(param)!;
    return <CommunityCategory category={cat} />;
  }
  return <CommunityArticle param={param} />;
};

function CommunityArticle({ param }: { param: string }) {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [author, setAuthor] = useState<{ username: string; display_name: string | null; avatar_url: string | null } | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [copied, setCopied] = useState(false);
  const [sourceDataset, setSourceDataset] = useReactState<Dataset | null>(null);

  useEffect(() => {
    let alive = true;
    getCommunityProjectByParam(param).then((p) => {
      if (!alive) return;
      if (p && p.isPublic) setProject(p);
      else setProject(null);
    });
    return () => {
      alive = false;
    };
  }, [param]);

  useEffect(() => {
    if (!project) return;
    if (project.userId) getProfileByUserId(project.userId).then(setAuthor);
    getRelatedCommunityProjects(project.id, project.category, 6).then(setRelated);
    recordProjectEvent(project.id, "view");
    if (project.datasetId) getDatasetById(project.datasetId).then(setSourceDataset);
    else setSourceDataset(null);
  }, [project]);

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

  const slugOrId = project.slug || project.id;
  const url = communityUrl(slugOrId);
  const title = project.settings?.title || project.name;
  const text = `${title} — animated data video built with Data to Video`;
  const links = shareLinks(url, text);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cat = getCategory(project.category);
  const seoTitle = project.seoTitle || `${title} — Animated Data Video`;
  const metaDesc =
    project.metaDescription ||
    (project.summary ? project.summary.slice(0, 155) : `Animated data video by ${project.authorName || "a Data to Video creator"}.`);

  const jsonLd: object[] = [
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Community", path: "/community" },
      ...(cat ? [{ name: cat.name, path: `/community/${cat.slug}` }] : []),
      { name: title, path: `/community/${slugOrId}` },
    ]),
    videoObjectLd(project, url),
    datasetLd(project, url),
  ];
  if (project.faqs?.length) jsonLd.push(faqLd(project.faqs));

  const labels = Array.from(new Set((project.data || []).map((r) => r.label)));
  const relatedKeywords = [title, ...labels.slice(0, 6)];
  return (
    <div className="min-h-screen flex flex-col">
      <Seo title={seoTitle} description={metaDesc} path={`/community/${slugOrId}`} jsonLd={jsonLd} />
      <article className="max-w-3xl mx-auto px-5 py-6 w-full flex-1">
        <button onClick={() => navigate("/community")} className="flex items-center gap-2 text-muted-foreground mb-4 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" /> Community
        </button>

        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Community", path: "/community" },
            ...(cat ? [{ name: cat.name, path: `/community/${cat.slug}` }] : []),
            { name: title },
          ]}
        />

        {cat ? (
          <Link to={`/community/${cat.slug}`} className="inline-block mb-3 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-semibold bg-secondary text-secondary-foreground">
            {cat.name}
          </Link>
        ) : null}

        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Published {project.publishedAt ? new Date(project.publishedAt).toLocaleDateString() : ""}
          {project.authorName ? ` · by ${project.authorName}` : ""}
        </p>

        <div className="mt-5">
          <CommunityProjectCard project={project} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <LikeButton projectId={project.id} initialCount={project.likeCount ?? 0} />
          {project.allowRemix !== false && (
            <RemixButton projectId={project.id} />
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-1">
            <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {(project.viewCount ?? 0).toLocaleString()} views</span>
            <span className="inline-flex items-center gap-1"><DownloadIcon className="w-3.5 h-3.5" /> {(project.downloadCount ?? 0).toLocaleString()}</span>
            {(project.remixCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> {project.remixCount}</span>
            )}
          </div>
        </div>

        {project.remixOf && (
          <p className="mt-3 text-xs text-muted-foreground">
            Inspired by <Link to={`/community/${project.remixOf}`} className="text-primary font-semibold">the original video</Link>
          </p>
        )}

        {sourceDataset && (
          <Link
            to={`/datasets/${sourceDataset.slug}`}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Database className="w-4 h-4" />
            </span>
            <span className="text-xs">
              <span className="text-muted-foreground">Dataset used: </span>
              <span className="font-semibold text-foreground">{sourceDataset.title}</span>
            </span>
          </Link>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="mt-4">
            <TagChips tags={project.tags} max={10} />
          </div>
        )}

        {project.description && (
          <p className="mt-5 text-foreground/90 whitespace-pre-line">{project.description}</p>
        )}

        <div className="mt-5 bg-card rounded-2xl p-4 border border-border">
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

        {project.summary ? (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-3">About this video</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line text-[15px]">
              {project.summary}
            </div>
          </section>
        ) : null}

        <KeyInsights insights={project.insights || []} />

        <DatasetTable project={project} />

        <FaqAccordion faqs={project.faqs || []} />

        <AuthorCard
          username={author?.username}
          displayName={author?.display_name}
          avatarUrl={author?.avatar_url}
          fallbackName={project.authorName}
        />

        <RelatedVideos projects={related} />

        <RelatedDatasets keywords={relatedKeywords} />

        <section className="mt-10 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-bold text-foreground">Create your own data video</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Drop in your own numbers or CSV and export a vertical MP4 in under two minutes.
          </p>
          <Link to="/create" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            Open the editor
          </Link>
        </section>

        <nav className="mt-10 pt-6 border-t border-border" aria-label="Browse by category">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Browse by category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== "other").map((c) => (
              <Link key={c.slug} to={`/community/${c.slug}`} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground hover:opacity-90">
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </article>
      <Footer />
    </div>
  );
};

export default CommunityProject;