import { DataRow, ProjectSettings, BAR_COLORS, ThemeType } from "./types";
import { processData, AnimationController, getFittedTitleFontSize } from "./animationEngine";
import { formatValue } from "./valueFormat";

function getThemeColors(theme: ThemeType) {
  switch (theme) {
    case "light":
      return { bg: "#f8f9fa", text: "#1a1a2e", sub: "#6b7280", vs: "#ef4444" };
    case "neon":
      return { bg: "#0a0a1a", text: "#00ffff", sub: "#ff00ff", vs: "#ff3366" };
    case "greenscreen":
      return { bg: "#00ff00", text: "#ffffff", sub: "#e0e0e0", vs: "#ffffff" };
    default:
      return { bg: "#16161e", text: "#f0f0f5", sub: "#8888a0", vs: "#ef4444" };
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

function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(t, 1); }
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createComparisonAnimation(
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

  // Create pairs for battle matchups
  const pairs: [string, string][] = [];
  for (let i = 0; i < labels.length - 1; i += 2) {
    pairs.push([labels[i], labels[i + 1] || labels[0]]);
  }
  if (pairs.length === 0 && labels.length >= 2) pairs.push([labels[0], labels[1]]);

  // Animated values
  const animValues: Record<string, number> = {};
  labels.forEach(l => animValues[l] = 0);

  function render(progress: number) {
    const w = canvas.width, h = canvas.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    const sidePad = w * 0.06;
    const topPad = h * 0.08;

    // Title
    if (settings.title) {
      ctx.fillStyle = theme.text;
      const titleMaxWidth = w - sidePad * 2;
      const titleFontSize = getFittedTitleFontSize(ctx, settings.title, w, w * 0.048, settings, titleMaxWidth);
      ctx.font = `bold ${titleFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(settings.title, w / 2, topPad, titleMaxWidth);
    }

    const dataProgress = Math.max(0, progress / 0.95);
    const yearRange = years[years.length - 1] - years[0];
    const currentYear = years[0] + yearRange * Math.min(dataProgress, 1);

    // Year display (draggable)
    const yp = settings.yearPos ?? { x: 0.85, y: 0.92 };
    ctx.fillStyle = theme.sub;
    ctx.globalAlpha = 0.12;
    ctx.font = `bold ${Math.round(w * 0.18)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(currentYear).toString(), w * yp.x, h * yp.y);
    ctx.globalAlpha = 1;

    // Year small
    ctx.fillStyle = theme.sub;
    ctx.font = `600 ${Math.round(w * 0.035)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(Math.round(currentYear).toString(), w / 2, topPad + w * 0.07);

    // Render each pair as a battle card
    const pairHeight = Math.min((h - topPad * 2 - 120) / pairs.length, h * 0.25);
    const pairGap = 12;
    const pairsStartY = topPad + 100;

    pairs.forEach((pair, pi) => {
      const [labelA, labelB] = pair;
      const valA = interpolateValue(valueMap[labelA] || {}, years, currentYear);
      const valB = interpolateValue(valueMap[labelB] || {}, years, currentYear);

      // Lerp animated values
      const lerpSpeed = settings.smoothAnimation ? 0.12 : 0.3;
      animValues[labelA] = lerp(animValues[labelA], valA, lerpSpeed);
      animValues[labelB] = lerp(animValues[labelB], valB, lerpSpeed);

      const y = pairsStartY + pi * (pairHeight + pairGap);
      const centerX = w / 2;
      const barMaxW = (w - sidePad * 2 - 80) / 2;

      const maxVal = Math.max(animValues[labelA], animValues[labelB], 1);
      const barWA = (animValues[labelA] / maxVal) * barMaxW;
      const barWB = (animValues[labelB] / maxVal) * barMaxW;

      const barH = Math.min(pairHeight * 0.35, 36);
      const barY = y + pairHeight * 0.45;

      // Left bar (grows left from center)
      ctx.fillStyle = colorMap[labelA];
      ctx.beginPath();
      ctx.roundRect(centerX - 30 - barWA, barY, barWA, barH, [6, 0, 0, 6]);
      ctx.fill();

      // Right bar (grows right from center)
      ctx.fillStyle = colorMap[labelB];
      ctx.beginPath();
      ctx.roundRect(centerX + 30, barY, barWB, barH, [0, 6, 6, 0]);
      ctx.fill();

      // VS badge
      ctx.fillStyle = theme.vs;
      ctx.beginPath();
      ctx.arc(centerX, barY + barH / 2, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(w * 0.025)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VS", centerX, barY + barH / 2);

      // Images & Labels - Left
      const imgSize = Math.min(pairHeight * 0.35, 44);
      const imgA = labelImages?.[labelA];
      if (imgA && imgA.complete && imgA.naturalWidth > 0) {
        const imgX = sidePad + 4;
        const imgY = y + 8;
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(imgA, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      if (settings.showLabels) {
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(w * 0.03)}px system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(labelA, sidePad + imgSize + 14, y + 12);
      }

      if (settings.showValues) {
        ctx.fillStyle = theme.sub;
        ctx.font = `500 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(formatValue(animValues[labelA], settings.valueFormat), sidePad + imgSize + 14, y + 14 + w * 0.035);
      }

      // Images & Labels - Right
      const imgB = labelImages?.[labelB];
      if (imgB && imgB.complete && imgB.naturalWidth > 0) {
        const imgX = w - sidePad - imgSize - 4;
        const imgY = y + 8;
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(imgB, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      if (settings.showLabels) {
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(w * 0.03)}px system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(labelB, w - sidePad - imgSize - 14, y + 12);
      }

      if (settings.showValues) {
        ctx.fillStyle = theme.sub;
        ctx.font = `500 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(formatValue(animValues[labelB], settings.valueFormat), w - sidePad - imgSize - 14, y + 14 + w * 0.035);
      }
    });

    if (!settings.hideWatermark) {
      const wp = settings.watermarkPos ?? { x: 0.5, y: 0.97 };
      ctx.fillStyle = theme.sub;
      ctx.globalAlpha = 0.4;
      ctx.font = `500 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
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
      playing = false; cancelAnimationFrame(animFrame); elapsed = 0; startTime = 0;
      labels.forEach(l => animValues[l] = 0);
      render(0);
    },
    destroy() { playing = false; cancelAnimationFrame(animFrame); },
    isPlaying: () => playing,
    async recordVideo(onRecordProgress: (p: number) => void, audioStream?: MediaStream): Promise<Blob> {
      playing = false; cancelAnimationFrame(animFrame); elapsed = 0; startTime = 0;
      labels.forEach(l => animValues[l] = 0);

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
              const progress = Math.min(frame / totalFrames, 1);
              // Run lerp iterations for smooth animation
              const dataProgress = Math.max(0, progress / 0.95);
              const yearRange = years[years.length - 1] - years[0];
              const currentYear = years[0] + yearRange * Math.min(dataProgress, 1);
              const lerpSpeed = settings.smoothAnimation ? 0.12 : 0.3;
              for (let s = 0; s < 12; s++) {
                labels.forEach(label => {
                  const val = interpolateValue(valueMap[label] || {}, years, currentYear);
                  animValues[label] = lerp(animValues[label], val, lerpSpeed);
                });
              }
              render(progress);
              track.requestFrame?.();
              onRecordProgress(progress);
              if (frame < totalFrames) await wait(frameDuration);
            }
            await wait(300); recorder.stop();
          } catch (error) { reject(error instanceof Error ? error : new Error("Recording failed")); }
        })();
      });
    },
  };
}
