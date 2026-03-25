import { DataRow, ProjectSettings, BAR_COLORS, ThemeType } from "./types";
import { processData, AnimationController } from "./animationEngine";

function getThemeColors(theme: ThemeType) {
  switch (theme) {
    case "light":
      return { bg: "#f8f9fa", text: "#1a1a2e", sub: "#6b7280", accent: "#f59e0b", card: "#ffffff" };
    case "neon":
      return { bg: "#0a0a1a", text: "#00ffff", sub: "#ff00ff", accent: "#ff00ff", card: "#111133" };
    default:
      return { bg: "#16161e", text: "#f0f0f5", sub: "#8888a0", accent: "#7c5cfc", card: "#1e1e2e" };
  }
}

function interpolateValue(
  valueMap: Record<number, number>,
  years: number[],
  currentYear: number
): number {
  if (valueMap[currentYear] !== undefined) return valueMap[currentYear];
  let lower = years[0], upper = years[years.length - 1];
  for (const y of years) {
    if (y <= currentYear) lower = y;
    if (y >= currentYear && upper === years[years.length - 1]) upper = y;
  }
  if (lower === upper) return valueMap[lower] || 0;
  const lv = valueMap[lower] || 0, uv = valueMap[upper] || 0;
  return lv + (uv - lv) * ((currentYear - lower) / (upper - lower));
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createTop10Animation(
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

  let playing = false, startTime = 0, elapsed = 0, animFrame = 0;

  // Use the latest year for final ranking
  const latestYear = years[years.length - 1];

  function render(progress: number) {
    const w = canvas.width, h = canvas.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    const sidePad = w * 0.08;
    const topPad = h * 0.1;

    // Title
    if (settings.title) {
      ctx.fillStyle = theme.text;
      ctx.font = `bold ${Math.round(w * 0.05)}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(settings.title, sidePad, topPad);
    }

    // Get final rankings
    const finalRanking = labels.map(label => ({
      label,
      value: interpolateValue(valueMap[label] || {}, years, latestYear),
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    // Reveal items one by one from #10 to #1 (bottom to top)
    const totalItems = finalRanking.length;
    const revealedCount = Math.min(Math.floor(progress * (totalItems + 1)), totalItems);

    const cardH = Math.min((h - topPad * 2 - 80) / totalItems, w * 0.12);
    const cardGap = 6;
    const listStartY = topPad + 70;

    for (let i = 0; i < totalItems; i++) {
      const rank = i + 1;
      const item = finalRanking[i];
      // Items reveal from bottom (rank 10) to top (rank 1)
      const revealIndex = totalItems - i; // 10 reveals first, 1 reveals last
      const isRevealed = revealIndex <= revealedCount;

      const y = listStartY + i * (cardH + cardGap);

      // Card background
      ctx.fillStyle = isRevealed ? theme.card : theme.bg;
      ctx.strokeStyle = isRevealed ? colorMap[item.label] : theme.sub + "33";
      ctx.lineWidth = isRevealed ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(sidePad, y, w - sidePad * 2, cardH, 10);
      ctx.fill();
      ctx.stroke();

      if (isRevealed) {
        // Rank number
        ctx.fillStyle = theme.accent;
        ctx.font = `bold ${Math.round(w * 0.045)}px system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`#${rank}`, sidePad + 14, y + cardH / 2);

        // Image
        const img = labelImages?.[item.label];
        const imgSize = cardH - 10;
        if (img && img.complete && img.naturalWidth > 0) {
          const imgX = sidePad + w * 0.12;
          const imgY = y + 5;
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
          ctx.font = `600 ${Math.round(w * 0.033)}px system-ui, sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(item.label, sidePad + w * 0.12 + imgSize + 12, y + cardH / 2);
        }

        // Value
        if (settings.showValues) {
          ctx.fillStyle = theme.sub;
          ctx.font = `500 ${Math.round(w * 0.028)}px system-ui, sans-serif`;
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillText(Math.round(item.value).toLocaleString(), w - sidePad - 14, y + cardH / 2);
        }
      } else {
        // Unrevealed placeholder
        ctx.fillStyle = theme.sub + "44";
        ctx.font = `bold ${Math.round(w * 0.04)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`#${rank}`, w / 2, y + cardH / 2);
      }
    }

    // Watermark
    ctx.fillStyle = theme.sub;
    ctx.globalAlpha = 0.4;
    ctx.font = `500 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Made with Data to Video", w / 2, h - 20);
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
    restart() { playing = false; cancelAnimationFrame(animFrame); elapsed = 0; startTime = 0; render(0); },
    destroy() { playing = false; cancelAnimationFrame(animFrame); },
    isPlaying: () => playing,
    async recordVideo(onRecordProgress: (p: number) => void, audioStream?: MediaStream): Promise<Blob> {
      playing = false; cancelAnimationFrame(animFrame); elapsed = 0; startTime = 0;
      const fps = 30, totalFrames = Math.round((totalMs / 1000) * fps), frameDuration = 1000 / fps;
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
      const stream = canvas.captureStream(fps);
      if (audioStream) {
        audioStream.getAudioTracks().forEach(t => stream.addTrack(t));
      }
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
              render(Math.min(frame / totalFrames, 1));
              track.requestFrame?.();
              onRecordProgress(Math.min(frame / totalFrames, 1));
              if (frame < totalFrames) await wait(frameDuration);
            }
            await wait(300); recorder.stop();
          } catch (error) { reject(error instanceof Error ? error : new Error("Recording failed")); }
        })();
      });
    },
  };
}
