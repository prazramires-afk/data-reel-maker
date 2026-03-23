import { DataRow, ProjectSettings, BAR_COLORS, ThemeType } from "./types";

interface BarState {
  label: string;
  value: number;
  targetValue: number;
  y: number;
  targetY: number;
  color: string;
  width: number;
  targetWidth: number;
}

function getThemeColors(theme: ThemeType) {
  switch (theme) {
    case "light":
      return { bg: "#f8f9fa", text: "#1a1a2e", sub: "#6b7280", bar: "#e5e7eb" };
    case "neon":
      return { bg: "#0a0a1a", text: "#00ffff", sub: "#ff00ff", bar: "#1a1a3e" };
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
  recordVideo: (onProgress: (p: number) => void) => Promise<Blob>;
}

export function createBarRaceAnimation(
  canvas: HTMLCanvasElement,
  data: DataRow[],
  settings: ProjectSettings,
  onProgress?: (progress: number) => void,
  onComplete?: () => void
): AnimationController {
  const ctx = canvas.getContext("2d")!;
  const { years, labels, valueMap } = processData(data);
  const theme = getThemeColors(settings.theme);
  const colorMap: Record<string, string> = {};
  labels.forEach((l, i) => (colorMap[l] = BAR_COLORS[i % BAR_COLORS.length]));

  const durationMs = settings.duration * 1000;
  const speedMultiplier = settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1;
  const totalMs = durationMs / speedMultiplier;

  const maxBars = Math.min(labels.length, 10);
  const barHeight = 36;
  const barGap = 10;
  const sidePadding = 20;
  const rightPadding = 20;
  const bottomPadding = 40;

  // Compute topPadding dynamically so chart is vertically centered
  function getTopPadding(canvasHeight: number) {
    const totalBarsHeight = maxBars * barHeight + (maxBars - 1) * barGap;
    const titleSpace = 60; // space for title above bars
    const contentHeight = titleSpace + totalBarsHeight;
    return Math.max(80, (canvasHeight - contentHeight) / 2);
  }

  let playing = false;
  let startTime = 0;
  let elapsed = 0;
  let animFrame = 0;
  let showHook = true;

  const hookText = settings.title
    ? `${settings.title}… #1 will shock you 😳`
    : "Top rankings… #1 will shock you 😳";

  const initTop = getTopPadding(canvas.height);
  const bars: BarState[] = labels.map((label, i) => ({
    label,
    value: 0,
    targetValue: 0,
    y: initTop + i * (barHeight + barGap),
    targetY: initTop + i * (barHeight + barGap),
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

    // Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Hook text fade out in first 15%
    if (showHook && progress < 0.15) {
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

    // Current year from progress
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
    const barAreaWidth = w - sidePadding - rightPadding - 100;

    // Update targets
    const topPad = getTopPadding(h);
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

    // Year display
    ctx.fillStyle = theme.sub;
    ctx.globalAlpha = 0.15;
    ctx.font = `bold ${Math.round(w * 0.18)}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(Math.round(currentYear).toString(), w - 12, h - 8);
    ctx.globalAlpha = 1;

    // Title — positioned above the bars area
    const titleY = topPad - 50;
    if (settings.title) {
      ctx.fillStyle = theme.text;
      ctx.font = `bold ${Math.round(w * 0.05)}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(settings.title, sidePadding, titleY);
    }

    // Year indicator small
    ctx.fillStyle = theme.sub;
    ctx.font = `600 ${Math.round(w * 0.035)}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(Math.round(currentYear).toString(), w - rightPadding, titleY);

    // Bars
    const visibleLabels = new Set(visible.map((v) => v.label));
    bars.forEach((bar) => {
      if (!visibleLabels.has(bar.label)) return;

      const x = sidePadding;
      const roundRadius = 6;

      // Bar
      ctx.fillStyle = bar.color;
      ctx.beginPath();
      ctx.roundRect(x, bar.y, Math.max(bar.width, 2), barHeight, [0, roundRadius, roundRadius, 0]);
      ctx.fill();

      // Label
      if (settings.showLabels) {
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(w * 0.032)}px system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(bar.label, x + bar.width - 8, bar.y + barHeight / 2);
      }

      // Value
      if (settings.showValues) {
        ctx.fillStyle = theme.sub;
        ctx.font = `500 ${Math.round(w * 0.028)}px system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(bar.value).toLocaleString(), x + bar.width + 8, bar.y + barHeight / 2);
      }
    });

    // Watermark
    ctx.fillStyle = theme.sub;
    ctx.globalAlpha = 0.4;
    ctx.font = `500 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Made with Data to Video", w / 2, h - bottomPadding + 30);
    ctx.globalAlpha = 1;
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
      const resetTop = getTopPadding(canvas.height);
      bars.forEach((b) => {
        b.value = 0;
        b.width = 0;
        b.y = resetTop + labels.indexOf(b.label) * (barHeight + barGap);
      });
      render(0);
    },
    destroy() {
      playing = false;
      cancelAnimationFrame(animFrame);
    },
    isPlaying: () => playing,
    async recordVideo(onRecordProgress: (p: number) => void): Promise<Blob> {
      // Reset state for recording
      playing = false;
      cancelAnimationFrame(animFrame);
      elapsed = 0;
      startTime = 0;
      showHook = true;
      const recTop = getTopPadding(canvas.height);
      bars.forEach((b) => {
        b.value = 0;
        b.width = 0;
        b.y = recTop + labels.indexOf(b.label) * (barHeight + barGap);
      });

      const fps = 30;
      const totalFrames = Math.round((totalMs / 1000) * fps);
      const frameDuration = 1000 / fps;

      // Try webm with VP9, fallback to VP8
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm;codecs=vp8';

      const stream = canvas.captureStream(0);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
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

        recorder.start();

        let frame = 0;
        const renderNextFrame = () => {
          if (frame > totalFrames) {
            recorder.stop();
            return;
          }

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
          const barAreaWidth = canvas.width - sidePadding - rightPadding - 100;

          const recTopPad = getTopPadding(canvas.height);
          visible.forEach((bd, i) => {
            const bar = bars.find((b) => b.label === bd.label)!;
            bar.targetValue = bd.value;
            bar.targetY = recTopPad + i * (barHeight + barGap);
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

          // Request a frame from the stream
          const track = stream.getVideoTracks()[0] as any;
          if (track?.requestFrame) track.requestFrame();

          onRecordProgress(progress);
          frame++;

          setTimeout(renderNextFrame, frameDuration / 10); // Render faster than realtime
        };

        renderNextFrame();
      });
    },
  };
}
