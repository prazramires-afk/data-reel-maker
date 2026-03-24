import { DataRow, ProjectSettings, BAR_COLORS, ThemeType } from "./types";
import { processData, AnimationController } from "./animationEngine";

function getThemeColors(theme: ThemeType) {
  switch (theme) {
    case "light":
      return { bg: "#f8f9fa", text: "#1a1a2e", sub: "#6b7280", accent: "#3b82f6", line: "#d1d5db" };
    case "neon":
      return { bg: "#0a0a1a", text: "#00ffff", sub: "#ff00ff", accent: "#00ff88", line: "#1a1a3e" };
    default:
      return { bg: "#16161e", text: "#f0f0f5", sub: "#8888a0", accent: "#7c5cfc", line: "#22222e" };
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function interpolateValue(
  valueMap: Record<number, number>,
  years: number[],
  currentYear: number
): number {
  if (valueMap[currentYear] !== undefined) return valueMap[currentYear];
  let lower = years[0];
  let upper = years[years.length - 1];
  for (const y of years) {
    if (y <= currentYear) lower = y;
    if (y >= currentYear && upper === years[years.length - 1]) upper = y;
  }
  if (lower === upper) return valueMap[lower] || 0;
  const lv = valueMap[lower] || 0;
  const uv = valueMap[upper] || 0;
  const t = (currentYear - lower) / (upper - lower);
  return lv + (uv - lv) * t;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createTimelineAnimation(
  canvas: HTMLCanvasElement,
  data: DataRow[],
  settings: ProjectSettings,
  onProgress?: (progress: number) => void,
  onComplete?: () => void,
  labelImages?: Record<string, HTMLImageElement>
): AnimationController {
  const ctx = canvas.getContext("2d")!;
  const { years, labels, valueMap } = processData(data);
  const theme = getThemeColors(settings.theme);
  const colorMap: Record<string, string> = {};
  labels.forEach((l, i) => (colorMap[l] = BAR_COLORS[i % BAR_COLORS.length]));

  const baseDuration = 15;
  const speedMultiplier = settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1;
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

    const sidePad = w * 0.08;
    const topPad = h * 0.12;
    const bottomPad = h * 0.1;

    // Title
    if (settings.title) {
      ctx.fillStyle = theme.text;
      ctx.font = `bold ${Math.round(w * 0.05)}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(settings.title, sidePad, topPad - w * 0.07);
    }

    const dataProgress = Math.max(0, progress / 0.95);
    const yearRange = years[years.length - 1] - years[0];
    const currentYear = years[0] + yearRange * Math.min(dataProgress, 1);

    // Timeline line
    const lineY = h * 0.45;
    const lineStartX = sidePad;
    const lineEndX = w - sidePad;
    const lineWidth = lineEndX - lineStartX;

    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(lineEndX, lineY);
    ctx.stroke();

    // Progress line
    const progressX = lineStartX + lineWidth * Math.min(dataProgress, 1);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(progressX, lineY);
    ctx.stroke();

    // Year markers
    years.forEach((year) => {
      const x = lineStartX + ((year - years[0]) / yearRange) * lineWidth;
      const passed = year <= currentYear;

      ctx.fillStyle = passed ? theme.accent : theme.line;
      ctx.beginPath();
      ctx.arc(x, lineY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = passed ? theme.text : theme.sub;
      ctx.font = `600 ${Math.round(w * 0.03)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(year.toString(), x, lineY + 18);
    });

    // Current year indicator
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(progressX, lineY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.bg;
    ctx.beginPath();
    ctx.arc(progressX, lineY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Data cards below timeline
    const cardTop = lineY + h * 0.1;
    const cardWidth = (w - sidePad * 2) / Math.min(labels.length, 5) - 8;
    const visibleLabels = labels.slice(0, 5);

    visibleLabels.forEach((label, i) => {
      const val = interpolateValue(valueMap[label] || {}, years, currentYear);
      const x = sidePad + i * (cardWidth + 8);
      const cardH = h * 0.35;

      // Card background
      ctx.fillStyle = theme.line;
      ctx.beginPath();
      ctx.roundRect(x, cardTop, cardWidth, cardH, 12);
      ctx.fill();

      // Value bar inside card
      const maxVal = Math.max(...labels.map(l => {
        const vals = Object.values(valueMap[l] || {});
        return Math.max(...vals, 0);
      }), 1);
      const barMaxH = cardH * 0.4;
      const barH = (val / maxVal) * barMaxH;
      ctx.fillStyle = colorMap[label];
      ctx.beginPath();
      ctx.roundRect(x + 8, cardTop + cardH - barH - 50, cardWidth - 16, barH, 6);
      ctx.fill();

      // Image
      const img = labelImages?.[label];
      if (img && img.complete && img.naturalWidth > 0) {
        const imgSize = Math.min(cardWidth * 0.5, 40);
        const imgX = x + (cardWidth - imgSize) / 2;
        const imgY = cardTop + 12;
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      // Label
      if (settings.showLabels) {
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(label, x + cardWidth / 2, cardTop + cardH - 28);
      }

      // Value
      if (settings.showValues) {
        ctx.fillStyle = theme.sub;
        ctx.font = `500 ${Math.round(w * 0.022)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(Math.round(val).toLocaleString(), x + cardWidth / 2, cardTop + cardH - 10);
      }
    });

    // Big year display
    ctx.fillStyle = theme.sub;
    ctx.globalAlpha = 0.12;
    ctx.font = `bold ${Math.round(w * 0.2)}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(Math.round(currentYear).toString(), w - 12, h - 8);
    ctx.globalAlpha = 1;

    // Watermark
    ctx.fillStyle = theme.sub;
    ctx.globalAlpha = 0.4;
    ctx.font = `500 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Made with Data to Video", w / 2, h - bottomPad + 30);
    ctx.globalAlpha = 1;
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
    async recordVideo(onRecordProgress: (p: number) => void): Promise<Blob> {
      playing = false; cancelAnimationFrame(animFrame);
      elapsed = 0; startTime = 0;

      const fps = 30;
      const totalFrames = Math.round((totalMs / 1000) * fps);
      const frameDuration = 1000 / fps;
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';

      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      return new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error('Recording failed'));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        recorder.start(250);
        const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };

        (async () => {
          try {
            for (let frame = 0; frame <= totalFrames; frame++) {
              const progress = Math.min(frame / totalFrames, 1);
              render(progress);
              track.requestFrame?.();
              onRecordProgress(progress);
              if (frame < totalFrames) await wait(frameDuration);
            }
            await wait(300);
            recorder.stop();
          } catch (error) { reject(error instanceof Error ? error : new Error("Recording failed")); }
        })();
      });
    },
  };
}
