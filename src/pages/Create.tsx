import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Trash2, Play, RotateCcw, Download, Share2, Pause, ImagePlus, Music, Sparkles, Lock, Coins, Globe2, CircleDot, Users, CheckCircle2, VolumeX, Film, Headphones, Zap, Drum } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  VideoType, DataRow, ProjectSettings, Project, DEFAULT_SETTINGS,
  VIDEO_TYPES, ThemeType, SpeedType, BAR_COLORS,
} from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import { GDP_SAMPLE, FOOTBALL_SAMPLE, POPULATION_SAMPLE, NBA_SAMPLE, CRYPTO_SAMPLE, COMPANIES_SAMPLE } from "@/lib/sampleData";
import { parseCSV } from "@/lib/parseCSV";
import { saveProject, getProjectById, generateId, publishProject, isValidProjectId } from "@/lib/storage";
import { communityUrl, copyToClipboard } from "@/lib/share";
import { createBarRaceAnimation, AnimationController } from "@/lib/animationEngine";
import { createTimelineAnimation } from "@/lib/timelineAnimation";
import { createTop10Animation } from "@/lib/top10Animation";
import { createComparisonAnimation } from "@/lib/comparisonAnimation";
import { AUDIO_TRACKS, createAudioStream } from "@/lib/audioTracks";
import { formatValue, UNIT_TYPE_OPTIONS, CURRENCY_PRESETS, DEFAULT_VALUE_FORMAT, ValueFormat, UnitType } from "@/lib/valueFormat";
import { Seo } from "@/components/Seo";

const STEPS = ["Type", "Data", "Style", "Preview", "Export"];
const VIDEO_COST = 5;

/**
 * Drag handle overlay for repositioning canvas-drawn elements.
 * Position is normalized (0-1) relative to the canvas container.
 */
const DraggableHandle = ({
  pos,
  onChange,
  label,
  containerRef,
}: {
  pos: { x: number; y: number };
  onChange: (p: { x: number; y: number }) => void;
  label: string;
  containerRef: React.RefObject<HTMLElement>;
}) => {
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0.02, Math.min(0.98, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0.02, Math.min(0.98, (ev.clientY - rect.top) / rect.height));
      onChange({ x, y });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      onPointerDown={onPointerDown}
      className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-primary/30 border border-primary text-[10px] font-semibold text-primary-foreground cursor-move select-none touch-none backdrop-blur-sm"
      style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
    >
      ⠿ {label}
    </div>
  );
};

const Create = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, credits, consumeTokens, loading: authLoading } = useAuth();
  const isPremium = !!credits?.is_premium;
  const [step, setStep] = useState(0);
  const [videoType, setVideoType] = useState<VideoType>("bar_race");
  const [data, setData] = useState<DataRow[]>([
    { label: "", value: 0, year: 2020 },
    { label: "", value: 0, year: 2020 },
    { label: "", value: 0, year: 2020 },
    { label: "", value: 0, year: 2020 },
    { label: "", value: 0, year: 2020 },
  ]);
  const [settings, setSettings] = useState<ProjectSettings>({ ...DEFAULT_SETTINGS });
  const [csvText, setCsvText] = useState("");
  const [dataTab, setDataTab] = useState<"manual" | "csv" | "sample">("manual");
  const [projectId, setProjectId] = useState(() => generateId());

  // Label images: label -> base64 data URL
  const [labelImages, setLabelImages] = useState<Record<string, string>>({});
  // Loaded HTMLImageElement cache for canvas rendering
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  const readImageFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

  const normalizeImageDataUrl = (src: string, size = 1200) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const outputSize = Math.max(size, Math.min(img.naturalWidth, img.naturalHeight, 2000));
        const offscreen = document.createElement("canvas");
        offscreen.width = outputSize;
        offscreen.height = outputSize;
        const ctx = offscreen.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to process image"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const sourceSize = Math.min(img.naturalWidth, img.naturalHeight);
        const sourceX = (img.naturalWidth - sourceSize) / 2;
        const sourceY = (img.naturalHeight - sourceSize) / 2;

        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
        resolve(offscreen.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });

  // Preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<AnimationController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Export
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exported, setExported] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [exportFormat, setExportFormat] = useState<"webm" | "mp4">("mp4");
  const [exportResolution, setExportResolution] = useState<"480p" | "720p" | "1080p">("1080p");
  const [selectedTrack, setSelectedTrack] = useState("none");
  const [sharingCommunity, setSharingCommunity] = useState(false);
  const [communityShareUrl, setCommunityShareUrl] = useState<string | null>(null);

  // Effective settings: free users can never hide watermark, regardless of toggle
  const effectiveSettings = useMemo(
    () => ({ ...settings, hideWatermark: !!settings.hideWatermark && isPremium }),
    [settings, isPremium]
  );

  // Redirect to auth if not signed in (after auth state has loaded)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Show upgrade toast when ?upgrade=1 is present
  useEffect(() => {
    if (searchParams.get("upgrade") === "1") {
      toast("Premium subscription will be available once a payment provider is enabled. Contact the developer to enable it.");
    }
  }, [searchParams]);

  // Load images into HTMLImageElement cache when labelImages change
  useEffect(() => {
    const newLoaded: Record<string, HTMLImageElement> = {};
    let remaining = Object.keys(labelImages).length;
    if (remaining === 0) {
      setLoadedImages({});
      return;
    }
    Object.entries(labelImages).forEach(([label, src]) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        newLoaded[label] = img;
        remaining--;
        if (remaining <= 0) setLoadedImages({ ...newLoaded });
      };
      img.onerror = () => {
        remaining--;
        if (remaining <= 0) setLoadedImages({ ...newLoaded });
      };
      img.src = src;
    });
  }, [labelImages]);

  // Load template or edit
  useEffect(() => {
    const templateId = searchParams.get("template");
    const editId = searchParams.get("edit");
    const datasetSlug = searchParams.get("dataset");

    const DATASET_MAP: Record<string, { data: DataRow[]; title: string }> = {
      "gdp-countries": { data: GDP_SAMPLE, title: "Top Economies by GDP" },
      "fifa-goals": { data: FOOTBALL_SAMPLE, title: "All-Time Football Goal Scorers" },
      "nba-points": { data: NBA_SAMPLE, title: "NBA All-Time Scoring Leaders" },
      "population-growth": { data: POPULATION_SAMPLE, title: "World Population Growth" },
      "richest-companies": { data: COMPANIES_SAMPLE, title: "Most Valuable Companies" },
      "crypto-marketcap": { data: CRYPTO_SAMPLE, title: "Top Crypto by Market Cap" },
    };

    if (templateId) {
      const tpl = TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        setVideoType(tpl.type);
        const ds = datasetSlug ? DATASET_MAP[datasetSlug] : undefined;
        setData(ds ? ds.data : tpl.data);
        setSettings(ds ? { ...tpl.settings, title: ds.title } : tpl.settings);
        setStep(2);
      }
    } else if (datasetSlug && DATASET_MAP[datasetSlug]) {
      const ds = DATASET_MAP[datasetSlug];
      setVideoType("bar_race");
      setData(ds.data);
      setSettings({ ...DEFAULT_SETTINGS, title: ds.title });
      setStep(2);
    } else if (editId) {
      getProjectById(editId).then((project) => {
        if (project) {
          setProjectId(project.id);
          setVideoType(project.type);
          setData(project.data);
          setSettings(project.settings);
          if (project.labelImages) setLabelImages(project.labelImages);
          setStep(2);
        }
      });
    }
  }, [searchParams]);

  // Canvas setup
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      controllerRef.current?.destroy();
      const createAnimation = videoType === "timeline" ? createTimelineAnimation
        : videoType === "top10" ? createTop10Animation
        : videoType === "comparison" ? createComparisonAnimation
        : createBarRaceAnimation;
      controllerRef.current = createAnimation(
        canvas, data, effectiveSettings,
        (p) => setProgress(p),
        () => setIsPlaying(false),
        loadedImages
      );
    }
    return () => controllerRef.current?.destroy();
  }, [step, data, effectiveSettings, loadedImages, videoType]);

  const handlePlay = () => {
    if (isPlaying) {
      controllerRef.current?.pause();
      setIsPlaying(false);
    } else {
      controllerRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    controllerRef.current?.restart();
    setIsPlaying(false);
    setProgress(0);
  };

  // Save project
  const handleSave = useCallback(async () => {
    const safeProjectId = isValidProjectId(projectId) ? projectId : generateId();
    if (safeProjectId !== projectId) setProjectId(safeProjectId);

    const project: Project = {
      id: safeProjectId,
      name: settings.title || "Untitled",
      type: videoType,
      data,
      settings,
      labelImages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveProject(project);
    return project;
  }, [projectId, videoType, data, settings, labelImages]);

  const resolutionMap = { "480p": { w: 480, h: 854 }, "720p": { w: 720, h: 1280 }, "1080p": { w: 1080, h: 1920 } };
  const useCustomSize = !!(settings.exportWidth && settings.exportHeight);
  const fileExt = exportFormat === "mp4" ? "mp4" : "webm";
  const selectedDurationSeconds = Math.round(15 / (settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1));

  const handleExport = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // Pre-check tokens (server is the source of truth via consume_tokens RPC)
    if ((credits?.tokens ?? 0) < VIDEO_COST) {
      toast.error(`Not enough tokens — you need ${VIDEO_COST}. Daily refill at 00:00 UTC.`);
      return;
    }

    // Deduct tokens atomically before rendering
    let consumed;
    try {
      consumed = await consumeTokens(VIDEO_COST);
    } catch (err) {
      toast.error("Could not deduct tokens. Try again.");
      return;
    }
    if (!consumed.success) {
      toast.error(`Not enough tokens — ${consumed.tokens_remaining} left.`);
      return;
    }

    await handleSave();
    setExporting(true);
    setExportProgress(0);
    setVideoBlob(null);
    setCommunityShareUrl(null);

    try {
      const { w, h } = useCustomSize
        ? { w: settings.exportWidth!, h: settings.exportHeight! }
        : resolutionMap[exportResolution];
      const exportCanvas = exportCanvasRef.current!;
      exportCanvas.width = w;
      exportCanvas.height = h;

      const createAnimation = videoType === "timeline" ? createTimelineAnimation
        : videoType === "top10" ? createTop10Animation
        : videoType === "comparison" ? createComparisonAnimation
        : createBarRaceAnimation;
      const controller = createAnimation(
        exportCanvas, data, effectiveSettings,
        () => {},
        () => {},
        loadedImages
      );

      // Calculate duration for audio
      const baseDuration = 15;
      const speedMultiplier = settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1;
      const totalMs = (baseDuration / speedMultiplier) * 1000;

      const audio = createAudioStream(selectedTrack, totalMs);
      const blob = await controller.recordVideo((p) => {
        setExportProgress(Math.round(p * 100));
      }, audio?.stream);

      audio?.stop();
      controller.destroy();
      setVideoBlob(blob);
      setExported(true);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleCommunityShare = async () => {
    if (!videoBlob || sharingCommunity) return;
    setSharingCommunity(true);

    try {
      const savedProject = await handleSave();
      // Upsert the full project with public flags in one call so the row is
      // guaranteed to exist (handles cases where the prior save failed or
      // only persisted locally).
      const published = await publishProject(savedProject, savedProject.authorName || undefined);
      if (!published.ok) {
        toast.error("Could not publish to Community. Please make sure you're signed in and try again.");
        return;
      }

      const url = communityUrl(published.slug || savedProject.id);
      setCommunityShareUrl(url);
      const copied = await copyToClipboard(url);

      if (navigator.share) {
        try {
          await navigator.share({
            title: savedProject.settings.title || savedProject.name || "Data to Video",
            text: "Watch my animated data video on Data to Video",
            url,
          });
        } catch (error) {
          if ((error as DOMException)?.name !== "AbortError") {
            console.warn("Native share failed", error);
          }
        }
      }

      toast.success(copied ? "Published to Community — link copied" : "Published to Community");
    } finally {
      setSharingCommunity(false);
    }
  };

  const addRow = () => setData([...data, { label: "", value: 0, year: 2020 }]);
  const removeRow = (i: number) => {
    if (data.length <= 5) return;
    setData(data.filter((_, idx) => idx !== i));
  };
  const updateRow = (i: number, field: keyof DataRow, value: string | number) => {
    const updated = [...data];
    updated[i] = { ...updated[i], [field]: field === "label" ? value : Number(value) };
    setData(updated);
  };

  const loadSample = (sample: DataRow[]) => {
    setData(sample);
    setDataTab("manual");
  };

  const handleImageUpload = (label: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const rawDataUrl = await readImageFile(file);
        const normalizedDataUrl = await normalizeImageDataUrl(rawDataUrl);
        setLabelImages((prev) => ({ ...prev, [label]: normalizedDataUrl }));
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    };
    input.click();
  };

  // Get unique labels from data
  const uniqueLabels = [...new Set(data.map((r) => r.label).filter(Boolean))];

  const canProceed = () => {
    if (step === 1) return data.filter((r) => r.label.trim()).length >= 5;
    return true;
  };

  const next = () => {
    if (step === 1 && dataTab === "csv" && csvText.trim()) {
      const parsed = parseCSV(csvText);
      if (parsed.length >= 5) setData(parsed);
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      <Seo
        title="Create animated data video — Data to Video"
        description="Build bar chart races, top 10 countdowns, timelines, and comparison videos from your CSV or manual data. Export 9:16 vertical videos for TikTok and Reels."
        path="/create"
      />
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} className="p-1.5 active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Step {step + 1}: {STEPS[step]}</p>
        </div>
        {user && (
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1">
            {isPremium ? <Sparkles className="w-3 h-3 text-primary" /> : <Coins className="w-3 h-3 text-muted-foreground" />}
            <span className="text-[11px] font-semibold text-foreground tabular-nums">
              {credits?.tokens ?? 0}/{isPremium ? 50 : 10}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-28 overflow-y-auto">
        {/* Step 0: Video Type */}
        {step === 0 && (
          <div className="opacity-0 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-1">Choose video type</h2>
            <p className="text-sm text-muted-foreground mb-5">Select the animation style</p>
            <div className="grid grid-cols-2 gap-3">
              {VIDEO_TYPES.map((vt) => (
                <button
                  key={vt.type}
                  onClick={() => vt.available && setVideoType(vt.type)}
                  className={`relative p-4 rounded-xl text-left transition-all active:scale-[0.96] ${
                    videoType === vt.type ? "bg-primary/15 ring-2 ring-primary" : "bg-card"
                  } ${!vt.available ? "opacity-50" : ""}`}
                >
                  <h3 className="font-semibold text-foreground text-sm">{vt.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{vt.description}</p>
                  {!vt.available && (
                    <span className="absolute top-2 right-2 text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Input Data */}
        {step === 1 && (
          <div className="opacity-0 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-4">Add your data</h2>

            {/* Tabs */}
            <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-5">
              {(["manual", "csv", "sample"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDataTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    dataTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {tab === "manual" ? "Table" : tab === "csv" ? "Paste CSV" : "Samples"}
                </button>
              ))}
            </div>

            {dataTab === "manual" && (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_70px_32px] gap-2 text-xs text-muted-foreground font-medium px-1">
                  <span>Label</span><span>Value</span><span>Year</span><span />
                </div>
                {data.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_70px_32px] gap-2">
                    <input
                      value={row.label}
                      onChange={(e) => updateRow(i, "label", e.target.value)}
                      placeholder="Name"
                      className="bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={row.value || ""}
                      onChange={(e) => updateRow(i, "value", e.target.value)}
                      placeholder="0"
                      className="bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={row.year || ""}
                      onChange={(e) => updateRow(i, "year", e.target.value)}
                      className="bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => removeRow(i)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive active:scale-90 transition-all disabled:opacity-30"
                      disabled={data.length <= 5}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addRow} className="flex items-center gap-2 text-sm text-primary font-medium mt-2 active:scale-95 transition-transform">
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>
            )}

            {dataTab === "csv" && (
              <div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted) {
                      e.preventDefault();
                      setCsvText(pasted);
                      const parsed = parseCSV(pasted);
                      if (parsed.length >= 5) {
                        setData(parsed);
                        setDataTab("manual");
                      }
                    }
                  }}
                  placeholder={"Year,USA,China,Japan\n2010,15000,6000,5000\n2020,21000,14700,5040"}
                  className="w-full h-48 bg-secondary rounded-xl p-4 text-sm text-foreground font-mono placeholder:text-muted-foreground resize-none outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Paste your CSV here — it will auto-populate the table</p>
                {csvText.trim() && (
                  <button
                    onClick={() => {
                      const parsed = parseCSV(csvText);
                      if (parsed.length >= 5) {
                        setData(parsed);
                        setDataTab("manual");
                      }
                    }}
                    className="mt-2 text-sm text-primary font-medium active:scale-95 transition-transform"
                  >
                    Load into Table →
                  </button>
                )}
              </div>
            )}

            {dataTab === "sample" && (
              <div className="flex flex-col gap-3">
                {[
                  { label: "GDP Countries", icon: Globe2, data: GDP_SAMPLE },
                  { label: "Football Goals", icon: CircleDot, data: FOOTBALL_SAMPLE },
                  { label: "Population Growth", icon: Users, data: POPULATION_SAMPLE },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => loadSample(s.data)}
                    className="bg-card rounded-xl p-4 text-left font-semibold text-foreground active:scale-[0.97] transition-transform flex items-center gap-3"
                  >
                    <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <s.icon className="w-4 h-4" />
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Label Images Section */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ImagePlus className="w-4 h-4" /> Add Photos (optional)
              </h3>
              {uniqueLabels.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {uniqueLabels.map((label) => (
                    <button
                      key={label}
                      onClick={() => handleImageUpload(label)}
                      className="flex items-center gap-2.5 bg-secondary rounded-xl p-3 text-left active:scale-[0.97] transition-transform overflow-hidden"
                    >
                      {labelImages[label] ? (
                        <img src={labelImages[label]} alt={label} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <ImagePlus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-foreground truncate">{label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground bg-secondary rounded-xl p-4">
                  Fill in label names above to add photos for each item.
                </p>
              )}
            </div>

            {/* Element Colors Section */}
            {uniqueLabels.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Element Colors</h3>
                <div className="rounded-xl bg-card border border-border p-3 mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">Apply one color to all</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Quickly unify your chart palette.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="color"
                      value={(() => {
                        const vals = Object.values(settings.labelColors ?? {});
                        return vals.length && vals.every(v => v === vals[0]) ? vals[0] : "#7c5cfc";
                      })()}
                      onChange={(e) => {
                        const c = e.target.value;
                        const next: Record<string, string> = {};
                        uniqueLabels.forEach(l => (next[l] = c));
                        setSettings({ ...settings, labelColors: next });
                      }}
                      className="w-9 h-9 rounded-lg bg-transparent border border-border cursor-pointer"
                      aria-label="Apply color to all elements"
                    />
                    <button
                      onClick={() => setSettings({ ...settings, labelColors: {} })}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground font-semibold active:scale-95 transition-transform"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {uniqueLabels.map((label, i) => {
                    const current = settings.labelColors?.[label] ?? BAR_COLORS[i % BAR_COLORS.length];
                    return (
                      <label
                        key={label}
                        className="flex items-center gap-2.5 bg-secondary rounded-xl p-3 cursor-pointer overflow-hidden"
                      >
                        <input
                          type="color"
                          value={current}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              labelColors: { ...(settings.labelColors ?? {}), [label]: e.target.value },
                            })
                          }
                          className="w-9 h-9 rounded-full border-0 bg-transparent cursor-pointer shrink-0 p-0"
                          aria-label={`Color for ${label}`}
                        />
                        <span className="text-xs font-medium text-foreground truncate">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customize */}
        {step === 2 && (
          <div className="opacity-0 animate-fade-in space-y-6">
            <h2 className="text-xl font-bold text-foreground">Customize</h2>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Video Title</label>
              <input
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="e.g. Top Economies by GDP"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Title Size</label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(((settings.titleScale ?? 1) * 100))}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={settings.titleScale ?? 1}
                onChange={(e) =>
                  setSettings({ ...settings, titleScale: parseFloat(e.target.value) })
                }
                className="w-full accent-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Adjust so the title fits nicely on your chosen video size.
              </p>
            </div>

            <div className="rounded-xl bg-card border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Auto-fit Title</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Uses {selectedDurationSeconds}s timing and safe margins to prevent export clipping.
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, titleAutoFit: !(settings.titleAutoFit ?? true) })}
                  className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
                    (settings.titleAutoFit ?? true) ? "bg-primary" : "bg-secondary"
                  }`}
                  aria-pressed={settings.titleAutoFit ?? true}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    (settings.titleAutoFit ?? true) ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Safe Margins</label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round((settings.titleSafeMargin ?? 0.08) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.04}
                  max={0.18}
                  step={0.01}
                  value={settings.titleSafeMargin ?? 0.08}
                  onChange={(e) => setSettings({ ...settings, titleSafeMargin: parseFloat(e.target.value) })}
                  disabled={settings.titleAutoFit === false}
                  className="w-full accent-primary disabled:opacity-40"
                />
              </div>
            </div>

            {/* Value Display Format */}
            {(() => {
              const vf: ValueFormat = settings.valueFormat ?? { ...DEFAULT_VALUE_FORMAT };
              const updateVf = (patch: Partial<ValueFormat>) =>
                setSettings({ ...settings, valueFormat: { ...vf, ...patch } });
              const sampleRaw = (() => {
                const numeric = data.map(d => d.value).filter(v => Number.isFinite(v) && v > 0);
                if (!numeric.length) return 1000000;
                return Math.max(...numeric);
              })();
              return (
                <div className="rounded-xl bg-card border border-border p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Value Display Format</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Controls how numbers appear in the video. Sorting still uses raw values.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Unit Type</label>
                    <select
                      value={vf.unitType}
                      onChange={(e) => updateVf({ unitType: e.target.value as UnitType })}
                      className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    >
                      {UNIT_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {vf.unitType === "currency" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Currency Symbol</label>
                        <div className="flex flex-wrap gap-1.5">
                          {CURRENCY_PRESETS.map(sym => (
                            <button
                              key={sym}
                              onClick={() => updateVf({ currencySymbol: sym })}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                vf.currencySymbol === sym ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {sym}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={vf.currencySymbol ?? ""}
                          onChange={(e) => updateVf({ currencySymbol: e.target.value })}
                          placeholder="Custom (e.g. USD)"
                          className="mt-2 w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Position</label>
                        <div className="flex gap-2">
                          {(["before", "after"] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => updateVf({ currencyPosition: p })}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                                (vf.currencyPosition ?? "before") === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {p} value
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {vf.unitType === "population" && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">Scale</label>
                      <div className="flex gap-2">
                        {([
                          { v: "people", l: "People" },
                          { v: "million", l: "Million" },
                          { v: "billion", l: "Billion" },
                        ] as const).map(s => (
                          <button
                            key={s.v}
                            onClick={() => updateVf({ populationScale: s.v })}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                              (vf.populationScale ?? "people") === s.v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {s.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {vf.unitType === "custom" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Prefix</label>
                        <input
                          type="text"
                          value={vf.prefix ?? ""}
                          onChange={(e) => updateVf({ prefix: e.target.value })}
                          placeholder="e.g. ★"
                          className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Suffix</label>
                        <input
                          type="text"
                          value={vf.suffix ?? ""}
                          onChange={(e) => updateVf({ suffix: e.target.value })}
                          placeholder="e.g. Goals"
                          className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">Abbreviate Large Numbers</p>
                      <p className="text-[10px] text-muted-foreground">1,000 → 1K · 1M · 1B · 1T</p>
                    </div>
                    <button
                      onClick={() => updateVf({ abbreviate: !vf.abbreviate })}
                      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${vf.abbreviate ? "bg-primary" : "bg-secondary"}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-background shadow transition-transform ${vf.abbreviate ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Decimal Places</label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(d => (
                        <button
                          key={d}
                          onClick={() => updateVf({ decimals: d })}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            (vf.decimals ?? 0) === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Live Preview</p>
                    <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                      {formatValue(sampleRaw, vf)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Raw value: {sampleRaw.toLocaleString()}</p>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Theme</label>
              <div className="flex gap-2 flex-wrap">
                {(["dark", "light", "neon", "greenscreen"] as ThemeType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSettings({ ...settings, theme: t })}
                    className={`flex-1 min-w-[70px] py-2.5 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
                      settings.theme === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    } ${t === "greenscreen" ? "!text-xs" : "capitalize"}`}
                  >
                    {t === "greenscreen" ? "Green Screen" : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Speed</label>
              <div className="flex gap-2">
                {(["slow", "medium", "fast"] as SpeedType[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSettings({ ...settings, speed: s })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors active:scale-95 ${
                      settings.speed === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Show Labels", key: "showLabels" as const },
                { label: "Show Values", key: "showValues" as const },
                { label: "Show Intro Text", key: "showIntro" as const },
                { label: "Smooth Animation", key: "smoothAnimation" as const },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium">{label}</span>
                  <button
                    onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      settings[key] ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings[key] ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              ))}

              {/* Premium-only: remove watermark */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground font-medium">Remove Watermark</span>
                  {!isPremium && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" /> Premium
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!isPremium) {
                      toast("Upgrade to Premium to remove the watermark.");
                      return;
                    }
                    setSettings({ ...settings, hideWatermark: !settings.hideWatermark });
                  }}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    isPremium && settings.hideWatermark ? "bg-primary" : "bg-secondary"
                  } ${!isPremium ? "opacity-60" : ""}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    isPremium && settings.hideWatermark ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </div>

            {/* Background Music */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Music className="w-4 h-4" /> Background Music
              </label>
              <div className="flex flex-col gap-2">
                {AUDIO_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.97] ${
                      selectedTrack === track.id
                        ? "bg-primary/15 ring-2 ring-primary"
                        : "bg-secondary"
                    }`}
                  >
                    {(() => {
                      const map: Record<string, typeof VolumeX> = {
                        none: VolumeX,
                        "epic-rise": Film,
                        "chill-beats": Headphones,
                        "digital-pulse": Zap,
                        "dramatic-drums": Drum,
                      };
                      const Icon = map[track.id] ?? Music;
                      return <Icon className="w-5 h-5 text-primary" />;
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{track.name}</p>
                      <p className="text-xs text-muted-foreground">{track.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="opacity-0 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-4">Preview</h2>
            <p className="text-xs text-muted-foreground mb-2">Tip: drag the year and watermark labels to reposition them.</p>
            <div ref={previewContainerRef} className="relative bg-card rounded-2xl overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ aspectRatio: "9/16", maxHeight: "70vh" }}
              />
              <DraggableHandle
                containerRef={previewContainerRef}
                pos={settings.yearPos ?? { x: 0.85, y: 0.92 }}
                onChange={(p) => setSettings({ ...settings, yearPos: p })}
                label="Year"
              />
              {!effectiveSettings.hideWatermark && (
                <DraggableHandle
                  containerRef={previewContainerRef}
                  pos={settings.watermarkPos ?? { x: 0.5, y: 0.97 }}
                  onChange={(p) => setSettings({ ...settings, watermarkPos: p })}
                  label="Watermark"
                />
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-100 rounded-full" style={{ width: `${progress * 100}%` }} />
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={handleRestart} className="p-3 rounded-full bg-secondary active:scale-90 transition-transform">
                <RotateCcw className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={handlePlay} className="p-4 rounded-full bg-primary active:scale-90 transition-transform shadow-lg shadow-primary/25">
                {isPlaying ? <Pause className="w-6 h-6 text-primary-foreground" /> : <Play className="w-6 h-6 text-primary-foreground" />}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Export */}
        {step === 4 && (
          <div className="opacity-0 animate-fade-in text-center py-8">
            <h2 className="text-xl font-bold text-foreground mb-2">Export Video</h2>
            <p className="text-sm text-muted-foreground mb-6">Choose format & resolution, then export</p>

            {!exporting && !exported && (
              <div className="space-y-6">
                {/* Format selector */}
                <div className="text-left">
                  <label className="text-sm font-medium text-foreground block mb-2">Format</label>
                  <div className="flex gap-2">
                    {(["mp4", "webm"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setExportFormat(f)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold uppercase transition-colors active:scale-95 ${
                          exportFormat === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  {exportFormat === "mp4" && (
                    <p className="text-xs text-muted-foreground mt-1.5">Recorded as WebM, saved with .mp4 extension for compatibility</p>
                  )}
                </div>

                {/* Resolution selector */}
                <div className="text-left">
                  <label className="text-sm font-medium text-foreground block mb-2">Resolution</label>
                  <div className="flex gap-2">
                    {(["480p", "720p", "1080p"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setExportResolution(r);
                          setSettings({ ...settings, exportWidth: undefined, exportHeight: undefined });
                        }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
                          !useCustomSize && exportResolution === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {useCustomSize
                      ? `Custom: ${settings.exportWidth}×${settings.exportHeight}`
                      : `${resolutionMap[exportResolution].w}×${resolutionMap[exportResolution].h} vertical`}
                  </p>
                </div>

                {/* Custom size */}
                <div className="text-left">
                  <label className="text-sm font-medium text-foreground block mb-2">Custom Size (optional)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={120}
                      max={3840}
                      placeholder="Width"
                      value={settings.exportWidth ?? ""}
                      onChange={(e) => setSettings({ ...settings, exportWidth: e.target.value ? Number(e.target.value) : undefined })}
                      className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-muted-foreground">×</span>
                    <input
                      type="number"
                      min={120}
                      max={3840}
                      placeholder="Height"
                      value={settings.exportHeight ?? ""}
                      onChange={(e) => setSettings({ ...settings, exportHeight: e.target.value ? Number(e.target.value) : undefined })}
                      className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Set both to crop the video to a custom size. Leave empty to use the preset above.
                  </p>
                </div>

                <button
                  onClick={handleExport}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg active:scale-[0.97] transition-transform shadow-lg shadow-primary/25"
                >
                  Export Video · {VIDEO_COST} tokens
                </button>
              </div>
            )}

            {exporting && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Rendering at {exportResolution}…</p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${exportProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">{exportProgress}%</p>
              </div>
            )}

            {exported && videoBlob && (
              <div className="space-y-4 opacity-0 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <p className="font-semibold text-foreground">Ready!</p>
                <p className="text-sm text-muted-foreground">
                  {exportResolution} {exportFormat.toUpperCase()} — {(videoBlob.size / 1024 / 1024).toFixed(1)} MB
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(videoBlob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${settings.title || "data-video"}.${fileExt}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-95 transition-transform"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={handleCommunityShare}
                    disabled={sharingCommunity}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary text-foreground font-semibold active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
                  >
                    <Share2 className="w-4 h-4" /> {sharingCommunity ? "Publishing…" : "Share"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share publishes this export to Community and copies the public link.
                </p>
                {communityShareUrl && (
                  <button
                    onClick={() => {
                      const u = new URL(communityShareUrl);
                      navigate(u.pathname);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/15 text-primary text-sm font-semibold active:scale-95 transition-transform"
                  >
                    <Globe2 className="w-4 h-4" /> Open Community Video
                  </button>
                )}
                <button
                  onClick={() => navigate("/projects")}
                  className="text-sm text-primary font-medium mt-2"
                >
                  View all projects →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for export rendering */}
      <canvas ref={exportCanvasRef} className="hidden" />

      {/* Bottom Nav */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-xl border-t border-border max-w-lg mx-auto">
          <button
            onClick={next}
            disabled={!canProceed()}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40 disabled:active:scale-100 shadow-lg shadow-primary/20"
          >
            {step === 3 ? "Continue to Export" : "Next"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Create;
