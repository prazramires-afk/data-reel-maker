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
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
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

  const baseDuration = Math.max(12, Math.min(40, 3 + events.length * 2.5)); // ~2.5s per event
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

    // ---- Horizontal timeline + one focused event card at a time ----
    const lineY = h * 0.78;
    const lineLeft = sidePad;
    const lineRight = w - sidePad;
    const lineW = lineRight - lineLeft;
    const dotR = Math.max(6, w * 0.011);

    // Base line
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = Math.max(2, w * 0.005);
    ctx.beginPath();
    ctx.moveTo(lineLeft, lineY);
    ctx.lineTo(lineRight, lineY);
    ctx.stroke();

    // Which event is focused right now, and how far into its slot we are.
    const slot = progress * events.length; // [0, events.length]
    const rawIdx = Math.min(events.length - 1, Math.floor(slot));
    const localT = clamp01(slot - rawIdx); // [0..1] within slot
    // Transition window: last 25% of a slot slides toward next; first 15% eases in.
    const enterT = easeOut(clamp01(localT / 0.15));
    const exitT = easeInOut(clamp01((localT - 0.75) / 0.25));
    // Effective focus index (fractional) for line-progress travel.
    const focusFloat = rawIdx + exitT;

    // Dot positions (evenly spaced; single-event fallback centered)
    const dotX = (i: number) =>
      events.length === 1
        ? (lineLeft + lineRight) / 2
        : lineLeft + (lineW * i) / (events.length - 1);

    // Progress line up to focused position
    const progressX = events.length === 1 ? dotX(0) : lineLeft + (lineW * focusFloat) / (events.length - 1);
    ctx.strokeStyle = settings.yearColor ?? theme.accent;
    ctx.lineWidth = Math.max(3, w * 0.007);
    ctx.beginPath();
    ctx.moveTo(lineLeft, lineY);
    ctx.lineTo(progressX, lineY);
    ctx.stroke();

    // Draw all dots
    events.forEach((_ev, i) => {
      const x = dotX(i);
      const reached = i < rawIdx || (i === rawIdx && exitT >= 1);
      const isFocus = i === rawIdx;
      ctx.fillStyle = reached || isFocus ? (settings.yearColor ?? theme.accent) : theme.line;
      ctx.beginPath();
      ctx.arc(x, lineY, isFocus ? dotR * 1.5 : dotR, 0, Math.PI * 2);
      ctx.fill();
      if (isFocus) {
        ctx.fillStyle = theme.bg;
        ctx.beginPath();
        ctx.arc(x, lineY, dotR * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Year labels under every dot for context
    const dotYearFont = Math.max(10, Math.round(w * 0.02));
    ctx.font = `700 ${dotYearFont}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    events.forEach((ev, i) => {
      const x = dotX(i);
      const isFocus = i === rawIdx;
      ctx.fillStyle = isFocus ? (settings.yearColor ?? theme.accent) : theme.sub;
      ctx.fillText(formatYear(ev.year), x, lineY + dotR * 2 + 6);
    });

    // Travelling indicator (progressX)
    ctx.fillStyle = settings.yearColor ?? theme.accent;
    ctx.beginPath();
    ctx.arc(progressX, lineY, dotR * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Card region (single focused card centered above the line)
    const cardCenterX = w / 2;
    const cardTop = h * 0.22;
    const cardBottom = lineY - h * 0.06;
    const cardH = cardBottom - cardTop;
    const cardW = w - sidePad * 2;
    const cardLeft = cardCenterX - cardW / 2;

    // Slide offsets: current slides out to left as exitT grows; incoming slides in from right during exitT
    const slideOut = -exitT * w * 0.6;
    const slideIn = (1 - exitT) * w * 0.6;

    const drawCard = (ev: EventRow, offsetX: number, alpha: number) => {
      if (alpha <= 0.001) return;
      ctx.globalAlpha = alpha;

      const originX = cardLeft + offsetX;

      // Optional event image (circle) on the left — keyed by event index so
      // every event gets its own uploaded photo, independent of the title.
      const idx = events.indexOf(ev);
      const img = labelImages?.[`__event_img__${idx}`];
      const hasImg = !!(img && img.complete && img.naturalWidth > 0);
      const imgSize = Math.min(cardH * 0.55, w * 0.22);
      const imgX = originX + w * 0.02;
      const imgY = cardTop + (cardH - imgSize) / 2;
      const textX = hasImg ? imgX + imgSize + w * 0.03 : originX + w * 0.02;
      const textMaxW = cardLeft + cardW - textX - w * 0.02;

      if (hasImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        // Thin ring
        ctx.lineWidth = Math.max(3, w * 0.005);
        ctx.strokeStyle = settings.yearColor ?? theme.accent;
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(img!, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      // Year (big accent)
      const yearFontSize = Math.round(w * 0.075);
      ctx.fillStyle = settings.yearColor ?? theme.accent;
      ctx.font = `900 ${yearFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const yearText = formatYear(ev.year);
      ctx.fillText(yearText, textX, cardTop);

      // Title
      const titleFontSize = Math.round(w * 0.05);
      ctx.fillStyle = settings.labelColor ?? theme.text;
      ctx.font = `800 ${titleFontSize}px system-ui, sans-serif`;
      const titleLines = wrapText(ctx, ev.title, textMaxW);
      const titleY = cardTop + yearFontSize + 8;
      const shownTitle = titleLines.slice(0, 2);
      shownTitle.forEach((ln, k) => {
        ctx.fillText(ln, textX, titleY + k * (titleFontSize + 6));
      });

      // Description
      if (ev.description) {
        const descFontSize = Math.round(w * 0.032);
        ctx.fillStyle = theme.sub;
        ctx.font = `500 ${descFontSize}px system-ui, sans-serif`;
        const descY = titleY + shownTitle.length * (titleFontSize + 6) + 8;
        const descLines = wrapText(ctx, ev.description, textMaxW);
        const maxDescLines = Math.max(1, Math.floor((cardBottom - descY) / (descFontSize + 4)));
        descLines.slice(0, maxDescLines).forEach((ln, k) => {
          ctx.fillText(ln, textX, descY + k * (descFontSize + 4));
        });
      }

      ctx.globalAlpha = 1;
    };

    // Focused (current) card — enters at localT=0, slides out at end
    const current = events[rawIdx];
    const currentAlpha = enterT * (1 - exitT);
    drawCard(current, slideOut, currentAlpha);

    // Incoming (next) card — only during exit transition
    if (exitT > 0 && rawIdx + 1 < events.length) {
      const nextEv = events[rawIdx + 1];
      drawCard(nextEv, slideIn, exitT);
    }

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