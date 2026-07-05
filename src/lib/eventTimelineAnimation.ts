import { EventRow, ProjectSettings, ThemeType, getSpeedMultiplier } from "./types";
import { AnimationController, getFittedTitleFontSize, normalizeRecordVideoOptions, drawUserBackground } from "./animationEngine";
import { encodeCanvasToMp4, encodeCanvasToWebM, type RecordVideoOptions } from "./videoEncoding";
import { enforceWatermarkSettings } from "./watermarkPolicy";
import { formatYear } from "./parseEventCSV";

function getThemeColors(theme: ThemeType) {
  switch (theme) {
    case "light":
      return { bg: "#f8f9fa", text: "#1a1a2e", sub: "#6b7280", accent: "#3b82f6", line: "#d1d5db", card: "#ffffff" };
    case "neon":
      return { bg: "#0a0a1a", text: "#00ffff", sub: "#ff00ff", accent: "#00ff88", line: "#1a1a3e", card: "#111133" };
    case "greenscreen":
      return { bg: "#00ff00", text: "#ffffff", sub: "#e0e0e0", accent: "#ffffff", line: "#00dd00", card: "#00cc00" };
    default:
      return { bg: "#16161e", text: "#f0f0f5", sub: "#8888a0", accent: "#7c5cfc", line: "#22222e", card: "#1e1e2a" };
  }
}

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (ctx.measureText(trial).width <= maxWidth) cur = trial;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function createEventTimelineAnimation(
  canvas: HTMLCanvasElement,
  _dataUnused: unknown, // signature parity with other engines
  settings: ProjectSettings,
  onProgress?: (progress: number) => void,
  onComplete?: () => void,
  labelImages?: Record<string, HTMLImageElement>,
): AnimationController {
  const ctx = canvas.getContext("2d")!;
  settings = enforceWatermarkSettings(settings);
  const theme = getThemeColors(settings.theme);
  const events = (settings.events ?? []).slice().sort((a, b) => a.year - b.year);

  const baseDuration = Math.max(12, Math.min(30, 4 + events.length * 2)); // ~2s per event, clamped
  const speedMultiplier = getSpeedMultiplier(settings.speed);
  const totalMs = (baseDuration / speedMultiplier) * 1000;

  let playing = false;
  let startTime = 0;
  let elapsed = 0;
  let animFrame = 0;

  function render(progress: number) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);
    drawUserBackground(ctx, w, h, labelImages);

    const sidePad = w * 0.08;

    // Title
    if (settings.title) {
      ctx.fillStyle = settings.titleColor ?? theme.text;
      const titleMaxWidth = w - sidePad * 2;
      const titleFontSize = getFittedTitleFontSize(ctx, settings.title, w, w * 0.05, settings, titleMaxWidth);
      ctx.font = `bold ${titleFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const titleY = Math.max(h * (settings.titleSafeMargin ?? 0.08), h * 0.05);
      ctx.fillText(settings.title, sidePad, titleY, titleMaxWidth);
    }

    if (events.length === 0) {
      ctx.fillStyle = theme.sub;
      ctx.font = `500 ${Math.round(w * 0.035)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Add events to preview", w / 2, h / 2);
      return;
    }

    // Vertical timeline (works for portrait & square; still fine for landscape)
    const lineX = sidePad + w * 0.06;
    const lineTop = h * 0.22;
    const lineBottom = h * (settings.hideWatermark ? 0.92 : 0.88);
    const lineH = lineBottom - lineTop;

    // Base line
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.beginPath();
    ctx.moveTo(lineX, lineTop);
    ctx.lineTo(lineX, lineBottom);
    ctx.stroke();

    // Reveal progression: how many events fully revealed by now
    const revealFloat = progress * (events.length + 0.5);
    const currentIdx = Math.min(events.length - 1, Math.floor(revealFloat));

    // Active dot travels along line
    const activeYBase = lineTop + (lineH / events.length) * (currentIdx + 0.5);

    // Progress line
    ctx.strokeStyle = settings.yearColor ?? theme.accent;
    ctx.lineWidth = Math.max(3, w * 0.008);
    ctx.beginPath();
    ctx.moveTo(lineX, lineTop);
    ctx.lineTo(lineX, activeYBase);
    ctx.stroke();

    // Event nodes + cards
    const rowH = lineH / events.length;
    const cardX = lineX + w * 0.05;
    const cardMaxW = w - cardX - sidePad;
    const yearFontSize = Math.round(w * 0.028);
    const titleFontSize = Math.round(w * 0.038);
    const descFontSize = Math.round(w * 0.028);

    events.forEach((ev, i) => {
      const nodeY = lineTop + rowH * (i + 0.5);
      const rawT = clamp01(revealFloat - i);
      const t = easeOut(rawT);
      const revealed = rawT > 0;
      const isActive = i === currentIdx;

      // Node dot
      const dotR = Math.max(6, w * 0.012);
      ctx.fillStyle = revealed ? (settings.yearColor ?? theme.accent) : theme.line;
      ctx.beginPath();
      ctx.arc(lineX, nodeY, dotR, 0, Math.PI * 2);
      ctx.fill();
      if (isActive) {
        ctx.fillStyle = theme.bg;
        ctx.beginPath();
        ctx.arc(lineX, nodeY, dotR * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!revealed) return;

      // Card fade + slide
      const alpha = t;
      const offsetX = (1 - t) * w * 0.03;
      ctx.globalAlpha = alpha;

      // Year label
      ctx.fillStyle = settings.yearColor ?? theme.accent;
      ctx.font = `800 ${yearFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const yearText = formatYear(ev.year);
      ctx.fillText(yearText, cardX + offsetX, nodeY - rowH * 0.42);

      // Event title
      ctx.fillStyle = settings.labelColor ?? theme.text;
      ctx.font = `700 ${titleFontSize}px system-ui, sans-serif`;
      const titleLines = wrapText(ctx, ev.title, cardMaxW);
      const titleY = nodeY - rowH * 0.42 + yearFontSize + 6;
      titleLines.slice(0, 2).forEach((ln, k) => {
        ctx.fillText(ln, cardX + offsetX, titleY + k * (titleFontSize + 4));
      });

      // Description (only render for active + previously-active if room)
      if (ev.description) {
        ctx.fillStyle = theme.sub;
        ctx.font = `500 ${descFontSize}px system-ui, sans-serif`;
        const descY = titleY + Math.min(titleLines.length, 2) * (titleFontSize + 4) + 4;
        const descLines = wrapText(ctx, ev.description, cardMaxW);
        const maxDescLines = Math.max(1, Math.floor((rowH * 0.55) / (descFontSize + 3)));
        descLines.slice(0, maxDescLines).forEach((ln, k) => {
          ctx.fillText(ln, cardX + offsetX, descY + k * (descFontSize + 3));
        });
      }

      ctx.globalAlpha = 1;
    });

    // Watermark
    if (!settings.hideWatermark) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 9);
      ctx.globalAlpha = 0.085;
      ctx.fillStyle = theme.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${Math.round(w * 0.14)}px system-ui, sans-serif`;
      ctx.fillText("datatovid.com", 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;

      const wp = settings.watermarkPos ?? { x: 0.5, y: 0.97 };
      ctx.fillStyle = theme.text;
      ctx.globalAlpha = 0.7;
      ctx.font = `700 ${Math.round(w * 0.04)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Made with datatovid.com", w * wp.x, h * wp.y);
      ctx.globalAlpha = 1;
    }
  }

  function tick(timestamp: number) {
    if (!playing) return;
    if (!startTime) startTime = timestamp;
    elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / totalMs, 1);
    render(progress);
    onProgress?.(progress);
    if (progress >= 1) { playing = false; onComplete?.(); return; }
    animFrame = requestAnimationFrame(tick);
  }

  render(0);

  return {
    play() {
      if (playing) return;
      playing = true;
      const savedElapsed = elapsed;
      animFrame = requestAnimationFrame((ts) => { startTime = ts - savedElapsed; tick(ts); });
    },
    pause() { playing = false; cancelAnimationFrame(animFrame); },
    restart() {
      playing = false; cancelAnimationFrame(animFrame);
      elapsed = 0; startTime = 0;
      render(0);
    },
    destroy() { playing = false; cancelAnimationFrame(animFrame); },
    isPlaying: () => playing,
    async recordVideo(onRecordProgress: (p: number) => void, options?: MediaStream | RecordVideoOptions): Promise<Blob> {
      playing = false; cancelAnimationFrame(animFrame);
      elapsed = 0; startTime = 0;

      const recordOptions = normalizeRecordVideoOptions(options);
      const renderEncodedFrame = (_frame: number, progress: number) => render(progress);
      if (recordOptions.format === "webm") {
        return encodeCanvasToWebM({ canvas, totalMs, renderFrame: renderEncodedFrame, onProgress: onRecordProgress, ...recordOptions });
      }
      return encodeCanvasToMp4({ canvas, totalMs, renderFrame: renderEncodedFrame, onProgress: onRecordProgress, ...recordOptions });
    },
  };
}