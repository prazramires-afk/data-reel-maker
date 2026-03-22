import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Trash2, Play, RotateCcw, Download, Share2, Pause } from "lucide-react";
import {
  VideoType, DataRow, ProjectSettings, Project, DEFAULT_SETTINGS,
  VIDEO_TYPES, DurationType, ThemeType, SpeedType,
} from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import { GDP_SAMPLE, FOOTBALL_SAMPLE, POPULATION_SAMPLE } from "@/lib/sampleData";
import { parseCSV } from "@/lib/parseCSV";
import { saveProject, getProjects, generateId } from "@/lib/storage";
import { createBarRaceAnimation, AnimationController } from "@/lib/animationEngine";

const STEPS = ["Type", "Data", "Style", "Preview", "Export"];

const Create = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  // Preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<AnimationController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Export
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exported, setExported] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  // Load template or edit
  useEffect(() => {
    const templateId = searchParams.get("template");
    const editId = searchParams.get("edit");

    if (templateId) {
      const tpl = TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        setVideoType(tpl.type);
        setData(tpl.data);
        setSettings(tpl.settings);
        setStep(2);
      }
    } else if (editId) {
      const project = getProjects().find((p) => p.id === editId);
      if (project) {
        setProjectId(project.id);
        setVideoType(project.type);
        setData(project.data);
        setSettings(project.settings);
        setStep(2);
      }
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
      // Reset dpr scale since animation engine uses canvas.width/height directly
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      controllerRef.current?.destroy();
      controllerRef.current = createBarRaceAnimation(
        canvas, data, settings,
        (p) => setProgress(p),
        () => setIsPlaying(false)
      );
    }
    return () => controllerRef.current?.destroy();
  }, [step, data, settings]);

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
  const handleSave = useCallback(() => {
    const project: Project = {
      id: projectId,
      name: settings.title || "Untitled",
      type: videoType,
      data,
      settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProject(project);
  }, [projectId, videoType, data, settings]);

  const handleExport = async () => {
    handleSave();
    setExporting(true);
    setExportProgress(0);
    setVideoBlob(null);

    try {
      // Create an offscreen canvas at 1080x1920 for high-quality export
      const exportCanvas = exportCanvasRef.current!;
      exportCanvas.width = 1080;
      exportCanvas.height = 1920;

      const controller = createBarRaceAnimation(
        exportCanvas, data, settings,
        () => {},
        () => {}
      );

      const blob = await controller.recordVideo((p) => {
        setExportProgress(Math.round(p * 100));
      });

      controller.destroy();
      setVideoBlob(blob);
      setExported(true);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
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
                  placeholder={"Year,USA,China,Japan\n2010,15000,6000,5000\n2020,21000,14700,5040"}
                  className="w-full h-48 bg-secondary rounded-xl p-4 text-sm text-foreground font-mono placeholder:text-muted-foreground resize-none outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">First column = Year, rest = data series</p>
              </div>
            )}

            {dataTab === "sample" && (
              <div className="flex flex-col gap-3">
                {[
                  { label: "🌍 GDP Countries", data: GDP_SAMPLE },
                  { label: "⚽ Football Goals", data: FOOTBALL_SAMPLE },
                  { label: "👥 Population Growth", data: POPULATION_SAMPLE },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => loadSample(s.data)}
                    className="bg-card rounded-xl p-4 text-left font-semibold text-foreground active:scale-[0.97] transition-transform"
                  >
                    {s.label}
                  </button>
                ))}
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
              <label className="text-sm font-medium text-foreground block mb-2">Duration</label>
              <div className="flex gap-2">
                {([5, 10, 15, 30] as DurationType[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSettings({ ...settings, duration: d })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
                      settings.duration === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Theme</label>
              <div className="flex gap-2">
                {(["dark", "light", "neon"] as ThemeType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSettings({ ...settings, theme: t })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors active:scale-95 ${
                      settings.theme === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t}
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
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="opacity-0 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-4">Preview</h2>
            <div className="bg-card rounded-2xl overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ aspectRatio: "9/16", maxHeight: "70vh" }}
              />
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
            <p className="text-sm text-muted-foreground mb-8">Save your project and download</p>

            {!exporting && !exported && (
              <button
                onClick={handleExport}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg active:scale-[0.97] transition-transform shadow-lg shadow-primary/25"
              >
                Export Video
              </button>
            )}

            {exporting && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Rendering…</p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${exportProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">{exportProgress}%</p>
              </div>
            )}

            {exported && videoBlob && (
              <div className="space-y-4 opacity-0 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                  <span className="text-3xl">✅</span>
                </div>
                <p className="font-semibold text-foreground">Ready!</p>
                <p className="text-sm text-muted-foreground">Your video has been rendered ({(videoBlob.size / 1024 / 1024).toFixed(1)} MB)</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(videoBlob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${settings.title || "data-video"}.webm`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-95 transition-transform"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={async () => {
                      if (navigator.share) {
                        const file = new File([videoBlob], `${settings.title || "data-video"}.webm`, { type: videoBlob.type });
                        try {
                          await navigator.share({ files: [file], title: settings.title || "Data to Video" });
                        } catch {}
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary text-foreground font-semibold active:scale-95 transition-transform"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
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
