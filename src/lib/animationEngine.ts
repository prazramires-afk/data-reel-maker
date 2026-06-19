import { DataRow, ProjectSettings, BAR_COLORS, ThemeType } from "./types";
import { formatValue } from "./valueFormat";

interface BarState {
  label: string;
  value: number;
  targetValue: number;
  y: number;
  targetY: number;
  color: string;
  width: number;
  targetWidth: number;
  // Spring velocities — drives momentum, inertia, slight overshoot, smooth settling.
  vValue: number;
  vY: number;
  vWidth: number;
  // Leader spotlight scale (0..1 -> 1.0..1.08 visually).
  spotlight: number;
}

function getThemeColors(theme: ThemeType) {
  switch (theme) {
    case "light":
      return { bg: "#f8f9fa", text: "#1a1a2e", sub: "#6b7280", bar: "#e5e7eb" };
    case "neon":
      return { bg: "#0a0a1a", text: "#00ffff", sub: "#ff00ff", bar: "#1a1a3e" };
    case "greenscreen":
      return { bg: "#00ff00", text: "#ffffff", sub: "#e0e0e0", bar: "#00dd00" };
    default:
      return { bg: "#16161e", text: "#f0f0f5", sub: "#8888a0", bar: "#22222e" };
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function processData(data: DataRow[]) {
  const yearsSet = new Set<number>();
  const labelsSet = new Set<string>();
  const valueMap: Record<string, Record<number, number>> = {};

  data.forEach((row) => {
    yearsSet.add(row.year);
    labelsSet.add(row.label);
    if (!valueMap[row.label]) valueMap[row.label] = {};
    valueMap[row.label][row.year] = row.value;
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);
  const labels = Array.from(labelsSet);

  return { years, labels, valueMap };
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

export interface AnimationController {
  play: () => void;
  pause: () => void;
  restart: () => void;
  destroy: () => void;
  isPlaying: () => boolean;
  recordVideo: (onProgress: (p: number) => void, audioStream?: MediaStream) => Promise<Blob>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getFittedTitleFontSize(
  ctx: CanvasRenderingContext2D,
  title: string,
  canvasWidth: number,
  baseSize: number,
  settings: ProjectSettings,
  maxWidth?: number,
) {
  const speedMultiplier = settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1;
  const durationSeconds = 15 / speedMultiplier;
  const durationFit = durationSeconds < 12 ? 0.95 : durationSeconds > 18 ? 1.05 : 1;
  const scaledSize = baseSize * (settings.titleScale ?? 1) * durationFit;
  if (settings.titleAutoFit === false || !title.trim()) return Math.round(scaledSize);

  const safeMargin = Math.max(0.04, Math.min(settings.titleSafeMargin ?? 0.08, 0.2));
  const availableWidth = Math.min(maxWidth ?? Number.POSITIVE_INFINITY, canvasWidth * (1 - safeMargin * 2));
  let fittedSize = scaledSize;
  ctx.font = `bold ${Math.round(fittedSize)}px system-ui, sans-serif`;

  const measuredWidth = ctx.measureText(title).width;
  if (measuredWidth > availableWidth) {
    fittedSize *= availableWidth / measuredWidth;
  }

  const minSize = canvasWidth * 0.014;
  return Math.round(Math.max(minSize, fittedSize));
}

export function createBarRaceAnimation(
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
  labels.forEach((l, i) => (colorMap[l] = settings.labelColors?.[l] ?? BAR_COLORS[i % BAR_COLORS.length]));

  const baseDuration = 15; // fixed 15s base
  const speedMultiplier = settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1;
  const totalMs = (baseDuration / speedMultiplier) * 1000;

  const maxBars = Math.min(labels.length, 10);
  // TikTok-viral compact layout: labels sit OUTSIDE the bar on the left (static gutter),
  // year sits to the right of the LOWEST bar, no giant background year.
  function metrics(w: number, h: number) {
    const labelGutter = Math.round(w * 0.26); // static left column for "Label  value"
    const sidePadding = Math.round(w * 0.04);
    const rightPadding = Math.round(w * 0.06);
    // Fit bars to height: maximize bar height so chart fills the frame.
    const titleSpace = Math.round(w * 0.14);
    const bottomSpace = Math.round(w * 0.08);
    const available = h - titleSpace - bottomSpace;
    const barHeight = Math.max(20, Math.floor(available / (maxBars * 1.18)));
    const barGap = Math.round(barHeight * 0.18);
    return { barHeight, barGap, sidePadding, rightPadding, labelGutter, titleSpace };
  }

  function getTopPadding(canvasWidth: number, canvasHeight: number) {
    const m = metrics(canvasWidth, canvasHeight);
    const totalBarsHeight = maxBars * m.barHeight + (maxBars - 1) * m.barGap;
    return Math.max(m.titleSpace, (canvasHeight - totalBarsHeight) / 2);
  }

  let playing = false;
  let startTime = 0;
  let elapsed = 0;
  let animFrame = 0;
  let showHook = true;

  const hookText = settings.title
    ? `${settings.title} — #1 will shock you`
    : "Top rankings — #1 will shock you";

  const initMetrics = metrics(canvas.width, canvas.height);
  const initTop = getTopPadding(canvas.width, canvas.height);
  const bars: BarState[] = labels.map((label, i) => ({
    label,
    value: 0,
    targetValue: 0,
    y: initTop + i * (initMetrics.barHeight + initMetrics.barGap),
    targetY: initTop + i * (initMetrics.barHeight + initMetrics.barGap),
    color: colorMap[label],
    width: 0,
    targetWidth: 0,
  }));

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * Math.min(t, 1);
  }

  function render(progress: number) {
    const w = canvas.width;
    const h = canvas.height;
    const { barHeight, barGap, sidePadding, rightPadding, labelGutter } = metrics(w, h);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Hook text fade out in first 15%
    if (settings.showIntro && showHook && progress < 0.15) {
      const hookAlpha = progress < 0.1 ? 1 : 1 - (progress - 0.1) / 0.05;
      ctx.save();
      ctx.globalAlpha = hookAlpha;
      ctx.fillStyle = theme.text;
      ctx.font = `bold ${Math.round(w * 0.045)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = hookText.match(/.{1,30}(\s|$)/g) || [hookText];
      lines.forEach((line, i) => {
        ctx.fillText(line.trim(), w / 2, h / 2 - 10 + i * 28);
      });
      ctx.restore();
      if (progress < 0.08) return;
    }

    const dataProgress = Math.max(0, (progress - 0.12) / 0.85);
    const yearRange = years[years.length - 1] - years[0];
    const currentYear = years[0] + yearRange * Math.min(dataProgress, 1);

    // Calculate values
    const barData = labels.map((label) => ({
      label,
      value: interpolateValue(valueMap[label] || {}, years, currentYear),
    }));

    // Sort descending
    barData.sort((a, b) => b.value - a.value);
    const visible = barData.slice(0, maxBars);
    const maxVal = Math.max(...visible.map((b) => b.value), 1);
    // Bars start after the static label gutter on the left.
    const barStartX = sidePadding + labelGutter;
    const barAreaWidth = w - barStartX - rightPadding;

    // Update targets
    const topPad = getTopPadding(w, h);
    visible.forEach((bd, i) => {
      const bar = bars.find((b) => b.label === bd.label)!;
      bar.targetValue = bd.value;
      bar.targetY = topPad + i * (barHeight + barGap);
      bar.targetWidth = (bd.value / maxVal) * barAreaWidth;
    });

    // Interpolate
    const lerpSpeed = settings.smoothAnimation ? 0.12 : 0.3;
    bars.forEach((bar) => {
      bar.value = lerp(bar.value, bar.targetValue, lerpSpeed);
      bar.y = lerp(bar.y, bar.targetY, lerpSpeed);
      bar.width = lerp(bar.width, bar.targetWidth, lerpSpeed);
    });

    // Title — positioned above the bars area
    const titleY = Math.max(sidePadding, topPad - Math.round(w * 0.09));
    if (settings.title) {
      ctx.fillStyle = theme.text;
      const titleMaxWidth = w - sidePadding - rightPadding - w * 0.16;
      const titleFontSize = getFittedTitleFontSize(
        ctx,
        settings.title,
        w,
        w * 0.05,
        settings,
        titleMaxWidth,
      );
      ctx.font = `bold ${titleFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(settings.title, sidePadding, titleY, titleMaxWidth);
    }

    // Bars + static left-side labels (TikTok viral style)
    const visibleLabels = new Set(visible.map((v) => v.label));
    const labelFontSize = Math.round(barHeight * 0.42);
    const valueFontSize = Math.round(barHeight * 0.36);
    bars.forEach((bar) => {
      if (!visibleLabels.has(bar.label)) return;

      const x = barStartX;
      const roundRadius = Math.round(barHeight * 0.18);
      const imgSize = barHeight - Math.round(barHeight * 0.12);

      // Static label on the LEFT (outside the bar), animates Y smoothly with the bar
      if (settings.showLabels) {
        ctx.fillStyle = theme.text;
        ctx.font = `700 ${labelFontSize}px system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(bar.label, x - Math.round(w * 0.018), bar.y + barHeight / 2);
      }

      // Bar
      ctx.fillStyle = bar.color;
      ctx.beginPath();
      ctx.roundRect(x, bar.y, Math.max(bar.width, 2), barHeight, [0, roundRadius, roundRadius, 0]);
      ctx.fill();

      const img = labelImages?.[bar.label];
      if (img && img.complete && img.naturalWidth > 0) {
        const imgX = x + Math.round(barHeight * 0.06);
        const imgY = bar.y + Math.round(barHeight * 0.06);
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      // Value: at end of bar
      if (settings.showValues) {
        ctx.fillStyle = theme.text;
        ctx.font = `700 ${valueFontSize}px system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          formatValue(bar.value, settings.valueFormat),
          x + Math.max(bar.width, 2) + Math.round(w * 0.012),
          bar.y + barHeight / 2,
        );
      }
    });

    // Year — sits to the right of the LOWEST (last visible) bar position
    const lastY = topPad + (maxBars - 1) * (barHeight + barGap);
    const yearFontSize = Math.round(barHeight * 1.1);
    ctx.fillStyle = theme.text;
    ctx.font = `900 ${yearFontSize}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
      Math.round(currentYear).toString(),
      w - rightPadding,
      lastY + barHeight + barGap + yearFontSize / 2 + Math.round(w * 0.01),
    );

    // Watermark (draggable) — can be hidden by premium users
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

    if (progress >= 1) {
      playing = false;
      onComplete?.();
      return;
    }

    animFrame = requestAnimationFrame(tick);
  }

  // Render first frame
  render(0);

  return {
    play() {
      if (playing) return;
      playing = true;
      showHook = elapsed === 0;
      startTime = 0;
      const savedElapsed = elapsed;
      animFrame = requestAnimationFrame((ts) => {
        startTime = ts - savedElapsed;
        tick(ts);
      });
    },
    pause() {
      playing = false;
      cancelAnimationFrame(animFrame);
    },
    restart() {
      playing = false;
      cancelAnimationFrame(animFrame);
      elapsed = 0;
      startTime = 0;
      showHook = true;
      const rm = metrics(canvas.width, canvas.height);
      const resetTop = getTopPadding(canvas.width, canvas.height);
      bars.forEach((b) => {
        b.value = 0;
        b.width = 0;
        b.y = resetTop + labels.indexOf(b.label) * (rm.barHeight + rm.barGap);
      });
      render(0);
    },
    destroy() {
      playing = false;
      cancelAnimationFrame(animFrame);
    },
    isPlaying: () => playing,
    async recordVideo(onRecordProgress: (p: number) => void, audioStream?: MediaStream): Promise<Blob> {
      // Reset state for recording
      playing = false;
      cancelAnimationFrame(animFrame);
      elapsed = 0;
      startTime = 0;
      showHook = true;
      const rm = metrics(canvas.width, canvas.height);
      const recTop = getTopPadding(canvas.width, canvas.height);
      bars.forEach((b) => {
        b.value = 0;
        b.width = 0;
        b.y = recTop + labels.indexOf(b.label) * (rm.barHeight + rm.barGap);
      });

      const fps = 30;
      const totalFrames = Math.round((totalMs / 1000) * fps);
      const frameDuration = 1000 / fps;

      // Try webm with VP9, fallback to VP8
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm;codecs=vp8';

      const stream = canvas.captureStream(fps);
      if (audioStream) {
        audioStream.getAudioTracks().forEach(t => stream.addTrack(t));
      }
      const recorder = new MediaRecorder(stream, {
        mimeType,
        // Higher bitrate so portrait HD exports stay crisp for social media.
        videoBitsPerSecond: 12_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      return new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error('Recording failed'));
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };

        recorder.start(250);

        const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };

        (async () => {
          try {
            for (let frame = 0; frame <= totalFrames; frame++) {
              const progress = Math.min(frame / totalFrames, 1);

              // Simulate elapsed time for lerp-based animation
              // Run multiple lerp iterations per frame for smooth catch-up
              const targetElapsed = progress * totalMs;
              elapsed = targetElapsed;

              // Update bar targets based on progress
              const dataProgress = Math.max(0, (progress - 0.12) / 0.85);
              const yearRange = years[years.length - 1] - years[0];
              const currentYear = years[0] + yearRange * Math.min(dataProgress, 1);

              const barData = labels.map((label) => ({
                label,
                value: interpolateValue(valueMap[label] || {}, years, currentYear),
              }));
              barData.sort((a, b) => b.value - a.value);
              const visible = barData.slice(0, maxBars);
              const maxVal = Math.max(...visible.map((b) => b.value), 1);
              const recM = metrics(canvas.width, canvas.height);
              const barStartX = recM.sidePadding + recM.labelGutter;
              const barAreaWidth = canvas.width - barStartX - recM.rightPadding;

              const recTopPad = getTopPadding(canvas.width, canvas.height);
              visible.forEach((bd, i) => {
                const bar = bars.find((b) => b.label === bd.label)!;
                bar.targetValue = bd.value;
                bar.targetY = recTopPad + i * (recM.barHeight + recM.barGap);
                bar.targetWidth = (bd.value / maxVal) * barAreaWidth;
              });

              // More lerp steps for recording so bars fully converge each frame
              const lerpSpeed = settings.smoothAnimation ? 0.12 : 0.3;
              for (let s = 0; s < 12; s++) {
                bars.forEach((bar) => {
                  bar.value = lerp(bar.value, bar.targetValue, lerpSpeed);
                  bar.y = lerp(bar.y, bar.targetY, lerpSpeed);
                  bar.width = lerp(bar.width, bar.targetWidth, lerpSpeed);
                });
              }

              render(progress);
              track.requestFrame?.();
              onRecordProgress(progress);

              if (frame < totalFrames) {
                await wait(frameDuration);
              }
            }

            await wait(300);
            recorder.stop();
          } catch (error) {
            reject(error instanceof Error ? error : new Error("Recording failed"));
          }
        })();
      });
    },
  };
}
